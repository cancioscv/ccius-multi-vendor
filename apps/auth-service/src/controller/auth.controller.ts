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
import { AuthError, ValidationError } from "@e-com/libs";
import { prisma } from "@e-com/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie.js";

// Register new user
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
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
};

// Verify user with otp
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
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
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
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
};

// Forgot passoword
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  await handleForgotPassword(req, res, next, "user");
};

// Reset password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
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
};

// Verify forgot password OTP
export const verifyUserForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  await verifyForgotPasswordOtp(req, res, next);
};
