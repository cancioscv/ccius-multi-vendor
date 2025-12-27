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

const { JsonWebTokenError } = jwt;

// Register new user
export async function registerUser(req: Request, res: Response, next: NextFunction) {
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
        return next(new AuthError("Invalid email or password"));
      }
    }

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
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return new ValidationError("Unauthorized. No refresh token.");
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { id: string; role: string };

    if (!decoded || !decoded.id || !decoded.role) {
      return new JsonWebTokenError("Forbidden!. Invalid refreseh token.");
    }

    // Find user or seller in the db

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
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

    setCookie(res, "refresh_token", newAccessToken);

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
