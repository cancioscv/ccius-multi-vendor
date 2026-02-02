import { NextFunction, Request, Response } from "express";
import {
  checkOtpRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyForgotPasswordOtp,
  verifyOtp,
} from "../utils/auth.helper.js";
import { AuthError, CustomRequest, NotFoundError, ValidationError } from "@e-com/libs";
import { prisma, UserRole } from "@e-com/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie.js";
import stripe from "../utils/stripe.js";
// import { producer } from "../utils/kafka.js";

const { JsonWebTokenError } = jwt;

// Register new user
export async function createUser(req: Request, res: Response, next: NextFunction) {
  validateRegistrationData(req.body, UserRole.USER);
  const { name, email } = req.body;

  const userExist = await prisma.user.findUnique({ where: { email } });

  if (userExist) {
    return next(new ValidationError("User with this email is already registered."));
  }

  await checkOtpRestrictions(email, next);
  await trackOtpRequests(email, next);
  await sendOtp(name, email, "user-activation-mail");

  res.status(200).json({ message: "Sent OTP to Email. Please verify your account." });
}

// Verify user with otp
export async function verifyUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      return next(new ValidationError("All fields are required."));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError("User already exist with this email."));
    }

    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await prisma.user.count();

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        ...(userCount === 0 && { role: UserRole.ADMIN }),
      },
    });

    // producer.send("user.created", {
    //   value: {
    //     username: user.name,
    //     email: user.email,
    //   },
    // });

    res.status(201).json({ succeed: true, message: "User registered successfully." });
  } catch (err) {
    return next(err);
  }
}

// Login
export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and passowrd are required."));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AuthError("User does not exist."));
    }

    if (user.password) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return next(new AuthError("Invalid password"));
      }
    }

    res.clearCookie("seller_access_token");
    res.clearCookie("seller_refresh_token");

    // Generate access and refresh token
    const accessToken = jwt.sign({ id: user.id, role: UserRole.USER }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "7d" }); //TODO: chang this to 15m
    const refreshToken = jwt.sign({ id: user.id, role: UserRole.USER }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" });

    // Store the access and refresh token in an httpOnly cookie
    setCookie(res, "access_token", accessToken);
    setCookie(res, "refresh_token", refreshToken);

    res.status(200).json({ message: "Login successfull", user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return next(err);
  }
}

// Logout
export async function logoutUser(req: Request, res: Response, next: NextFunction) {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(201).json({ success: true });
}

// Refresh token
export async function refreshToken(req: any, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies["refresh_token"] || req.cookies["seller_refresh_token"] || req.headers.authorization?.split(" ")[1];

    if (!refreshToken) {
      return new ValidationError("Unauthorized. No refresh token.");
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { id: string; role: string };

    if (!decoded || !decoded.id || !decoded.role) {
      return next(new JsonWebTokenError("Forbidden!. Invalid refreseh token."));
    }

    // Find user or seller in the db
    let account;

    if (decoded.role === UserRole.USER || decoded.role === UserRole.ADMIN) {
      account = await prisma.user.findUnique({ where: { id: decoded.id } });
    } else if (decoded.role === UserRole.SELLER) {
      account = await prisma.seller.findUnique({ where: { id: decoded.id }, include: { shop: true } });
    }

    if (!account) {
      return new AuthError("Forbidden!. User/Seller not found.");
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    if (decoded.role === UserRole.USER || decoded.role === UserRole.ADMIN) {
      setCookie(res, "access_token", newAccessToken);
    } else if (decoded.role === UserRole.SELLER) {
      setCookie(res, "seller_access_token", newAccessToken);
    }

    req.role = decoded.role;

    return res.status(201).json({ success: true, message: "New Access Token set successfully!!!" });
  } catch (err) {
    return next(err);
  }
}

// Forgot password
export async function forgotUserPassword(req: Request, res: Response, next: NextFunction) {
  await handleForgotPassword(req, res, next, UserRole.USER);
}

// Reset password
export async function resetUserPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return next(new ValidationError("Please enter email and new password."));

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(new ValidationError("User not found"));

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);

    if (isSamePassword) return next(new ValidationError("New password can not be similar than old password."));

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    next(error);
  }
}

// Verify forgot password OTP
export async function verifyForgotPassword(req: Request, res: Response, next: NextFunction) {
  await verifyForgotPasswordOtp(req, res, next);
}

// Get user from middleware isAuth
export async function getUser(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

// Get logged in Admin //TODO: This is exactly as getUser
export async function getAdmin(req: any, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

// Register new Seller
export async function createSeller(req: Request, res: Response, next: NextFunction) {
  try {
    validateRegistrationData(req.body, UserRole.SELLER);
    const { name, email } = req.body;

    const sellerExists = await prisma.seller.findUnique({ where: { email } });

    if (sellerExists) {
      throw new ValidationError("Seller already registered with this email.");
    }
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "seller-activation-email");

    res.status(200).json({ message: "OTP sent to email. Please verify your email account." });
  } catch (error) {
    next(error);
  }
}

// Verify Seller with OTP
export async function verifySeller(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name, password, otp, phoneNumber, country } = req.body;

    if (!email || !name || !password || !otp || !phoneNumber || !country) {
      return next(new ValidationError("All fields are required."));
    }

    const sellerExists = await prisma.seller.findUnique({ where: { email } });
    if (sellerExists) {
      return next(new ValidationError("Seller already registered with this email"));
    }

    await verifyOtp(email, otp, next);
    const hashedPassword = await bcrypt.hash(password, 10);

    const sellerData: any = {
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      country,
    };

    const seller = await prisma.seller.create({
      data: sellerData,
      include: { shop: true },
    });

    res.status(201).json({ seller, message: "Seller created successfully." });
  } catch (error) {
    return next(error);
  }
}

// Create new Shop
export async function createShop(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, bio, address, openingHours, website, category, sellerId } = req.body.data;
    if (!name || !bio || !address || !sellerId || !openingHours || !category) {
      return next(new ValidationError("All fields are required."));
    }

    const shopData: any = {
      name,
      bio,
      address,
      openingHours,
      category,
      sellerId,
    };

    if (website && website.trim() !== "") {
      shopData.website = website;
    }

    const shop = await prisma.shop.create({
      data: shopData,
      include: {
        followers: true,
      },
    });
    res.status(201).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
}

// Create Stripe connect account Link
export async function createStripeConnectLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { sellerId } = req.body;
    if (!sellerId) {
      return next(new ValidationError("Seller ID is required."));
    }

    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return next(new ValidationError("Seller is not available with this Id."));
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: seller?.email,
      country: "DE",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.seller.update({
      where: { id: sellerId },
      data: {
        stripeId: account.id,
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `http://localhost:3000/success`,
      return_url: `http://localhost:3000/success`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url, message: "Stripe Connect account created successfully." });
  } catch (error) {
    return next(error);
  }
}

// Login seller
export async function loginSeller(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError("Email and password are required."));
    }

    const seller = await prisma.seller.findUnique({ where: { email } });
    if (!seller) {
      return next(new ValidationError("Invalid email or password."));
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return next(new ValidationError("Invalid password."));
    }

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    // Generate access and refresh token
    const accessToken = jwt.sign({ id: seller.id, role: UserRole.SELLER }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: seller.id, role: UserRole.SELLER }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });

    // Store access and refresh tokens
    setCookie(res, "seller_access_token", accessToken);
    setCookie(res, "seller_refresh_token", refreshToken);

    res.status(200).json({ message: "Login succesful", seller: { id: seller.id, email: seller.email, name: seller.name } });
  } catch (error) {
    return next(error);
  }
}

// Logout seller
export async function logoutSeller(req: Request, res: Response, next: NextFunction) {
  res.clearCookie("seller_access_token");
  res.clearCookie("seller_refresh_token");

  res.status(201).json({
    success: true,
  });
}

// Get logged in Seller from middleware isAuth
export async function getSeller(req: any, res: Response, next: NextFunction) {
  try {
    const seller = req.seller;
    res.status(201).json({
      success: true,
      seller,
    });
  } catch (error) {
    return next(error);
  }
}

// Get Layout data
export async function getLayoutData(req: Request, res: Response, next: NextFunction) {
  try {
    const layout = await prisma.siteConfig.findFirst();
    return res.status(200).json({ success: true, layout });
  } catch (error) {
    return next(error);
  }
}

// Change User password
export async function updateUserPassword(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new ValidationError("Please enter all fields."));
    }
    if (newPassword !== confirmPassword) {
      return next(new ValidationError("New password do not match"));
    }
    if (newPassword === currentPassword) {
      return next(new ValidationError("New password must be different than current password."));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      return next(new AuthError("User not found or password not set."));
    }

    const comparePassword = await bcrypt.compare(currentPassword, user.password);

    if (!comparePassword) {
      return next(new AuthError("Current password is incorrect."));
    }

    const hashedPasswod = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPasswod },
    });

    return res.status(201).json({ message: "Password updated successfully." });
  } catch (error) {
    return next(error);
  }
}

// Register user address
export async function addUserAddress(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { name, street, city, zip, country, isDefault, addressType } = req.body;
    if (!name || !street || !zip || !city || !country || !addressType) {
      return next(new ValidationError("All fiels are required!!!"));
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const data = { userId, addressType, name, street, city, zip, country, isDefault };

    const newAddress = await prisma.address.create({ data });

    return res.status(201).json({ success: true, address: newAddress });
  } catch (error) {
    return next(error);
  }
}

// Get user shipping addresses
export async function getShippingAddresses(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, addresses });
  } catch (error) {
    return next(error);
  }
}

// Delete user address
export async function deleteUserAddress(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!addressId) {
      return next(new ValidationError("Address Id is required."));
    }

    const foundAddress = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!foundAddress) {
      return next(new NotFoundError("Address not found."));
    }

    await prisma.address.delete({ where: { id: addressId } });

    return res.status(200).json({ success: true, message: "Address deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

// Login admin
export async function loginAdmin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return next(new ValidationError("Email and password are required."));
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return next(new AuthError("User does not exist."));
    }

    if (user.password) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return next(new AuthError("Invalid email or password"));
      }
    }

    const isAdmin = user.role === UserRole.ADMIN;
    if (!isAdmin) {
      // Kafka send log error
    }

    // Kafka send log success

    res.clearCookie("seller_access_token");
    res.clearCookie("seller_refresh_token");

    // Generate access and refresh token
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: UserRole.ADMIN,
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        role: UserRole.ADMIN,
      },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );

    //Store the refresh and access token in an httpOnly secure cookie
    setCookie(res, "access_token", accessToken);
    setCookie(res, "reresh_token", refreshToken);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return next(error);
  }
}
