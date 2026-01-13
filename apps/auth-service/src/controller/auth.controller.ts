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
import { AuthError, CustomRequest, ValidationError } from "@e-com/libs";
import { prisma } from "@e-com/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie.js";
import stripe from "../utils/stripe.js";

const { JsonWebTokenError } = jwt;

// Register new user
export async function createUser(req: Request, res: Response, next: NextFunction) {
  validateRegistrationData(req.body, "user");
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

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ succeed: true, message: "User registered successfully." });
  } catch (err) {
    return next(err);
  }
}

// Login
export async function login(req: Request, res: Response, next: NextFunction) {
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
    const accessToken = jwt.sign({ id: user.id, role: "user" }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id, role: "user" }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" });

    // Store the access and refresh token in an httpOnly cookie
    setCookie(res, "access_token", accessToken);
    setCookie(res, "refresh_token", refreshToken);

    res.status(200).json({ message: "Login successfull", user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return next(err);
  }
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
      return new JsonWebTokenError("Forbidden!. Invalid refreseh token.");
    }

    // Find user or seller in the db
    let account;

    if (decoded.role === "user") {
      account = await prisma.user.findUnique({ where: { id: decoded.id } });
    } else if (decoded.role === "seller") {
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

    if (decoded.role === "usere") {
      // setCookie(res, "refresh_token", newAccessToken); // Warning: this was supposed to be refresh_roken instead of access_tokeen
      setCookie(res, "access_token", newAccessToken);
    } else if (decoded.role === "seller") {
      setCookie(res, "seller_access_token", newAccessToken);
    }

    req.role = decoded.role;

    return res.status(201).json({ success: true, message: "New Access Token set successfully!!!" });
  } catch (err) {
    return next(err);
  }
}

// Forgot password
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  await handleForgotPassword(req, res, next, "user");
}

// Reset password
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
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

// Register new Seller
export async function createSeller(req: Request, res: Response, next: NextFunction) {
  try {
    validateRegistrationData(req.body, "seller");
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

    const shop = await prisma.shop.create({ data: shopData });
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
    const accessToken = jwt.sign({ id: seller.id, role: "seller" }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: seller.id, role: "seller" }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });

    // Store access and refresh tokens
    setCookie(res, "seller_access_token", accessToken);
    setCookie(res, "seller_refresh_token", refreshToken);

    res.status(200).json({ message: "Login succesful", seller: { id: seller.id, email: seller.email, name: seller.name } });
  } catch (error) {
    return next(error);
  }
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
