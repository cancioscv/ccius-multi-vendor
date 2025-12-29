import { NextFunction, Request, Response } from "express";
import redis, { ValidationError } from "@e-com/libs";

import crypto from "crypto";
import { sendEmail } from "./sendMail/index.js";
import { prisma } from "@e-com/db";

export function validateRegistrationData(data: any, userType: "user" | "seller") {
  const { name, email, password, phoneNumber, country } = data;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!name || !email || !password || (userType === "seller" && (!phoneNumber || !country))) {
    throw new ValidationError("Missing required fields");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid Email");
  }
}

export async function checkOtpRestrictions(email: string, next: NextFunction) {
  const locked = await redis.get(`otp_lock:${email}`);
  if (locked) {
    return next(new ValidationError("Accout locked because of multiple failed attempts. Please try again after 30 minutes."));
  }

  const spamLocked = await redis.get(`otp_smap_lock:${email}`);
  if (spamLocked) {
    return next(new ValidationError("Too many OTP requests. Please wait 1 hour before requesting again."));
  }

  const cooldown = await redis.get(`otp_cooldown:${email}`);
  if (cooldown) {
    return next(new ValidationError("Please wait 1 minute before requesting a new OTP"));
  }
}

export async function trackOtpRequests(email: string, next: NextFunction) {
  const otpRequestLKey = `otp_request_count:${email}`;
  const otpRequests = parseInt((await redis.get(otpRequestLKey)) || "0");

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
    return next(new ValidationError("Too many OTP requests. Please wait 1 hour before requesting again."));
  }

  await redis.set(otpRequestLKey, otpRequests + 1, "EX", 3600);
}

export async function sendOtp(name: string, email: string, template: string) {
  const otp = crypto.randomInt(1000, 9999).toString();

  const subject = "Verify Your Email";
  await sendEmail(email, subject, template, { name, otp });

  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
}

export async function verifyOtp(email: string, otp: string, next: NextFunction) {
  const storedOtp = await redis.get(`otp:${email}`);

  if (!storedOtp) {
    throw new ValidationError("Invalid or expired OTP.");
  }

  const attemptsKey = `otp_attempts:${email}`;
  const attempts = parseInt((await redis.get(attemptsKey)) || "0");

  if (storedOtp !== otp) {
    if (attempts >= 2) {
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800); // Locked for 30 minutes
      await redis.del(`otp:${email}`, attemptsKey);

      throw new ValidationError("Too many failed attempts. Your account is locked, try again after 30 minutes.");
    }

    await redis.set(attemptsKey, attempts + 1, "EX", 300);
    throw new ValidationError(`Incorrect OTP. ${2 - attempts} attempts left.`);
  }

  await redis.del(`otp:${email}`, attemptsKey);
}

export async function handleForgotPassword(req: Request, res: Response, next: NextFunction, userType: "user" | "seller") {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError("Email is required");

    // Find either user or seller in DB

    const user = userType === "user" ? await prisma.user.findUnique({ where: { email } }) : await prisma.seller.findUnique({ where: { email } });
    if (!user) throw new ValidationError(`${userType} not found`);

    // Check otp restrictions
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);

    // Generate OTP and send Email
    const template = userType === "user" ? "forgot-password-user-email" : "forgot-password-seller-email";
    await sendOtp(user.name, user.email, template);

    res.status(200).json({ message: "OTP sent to email. Please verify your account." });
  } catch (error) {
    next(error);
  }
}

export async function verifyForgotPasswordOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) throw new ValidationError("Email and OTP are required");

    await verifyOtp(email, otp, next);

    res.status(200).json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    next(error);
  }
}
