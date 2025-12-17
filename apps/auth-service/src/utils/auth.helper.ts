import { NextFunction } from "express";
import redis, { ValidationError } from "@e-com/libs";

import crypto from "crypto";
import { sendEmail } from "./sendMail/index.js";

export const validateRegistrationData = (data: any, userType: "user" | "seller") => {
  const { name, email, password, phoneNumber, country } = data;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!name || !email || !password || (userType === "seller" && (!phoneNumber || !country))) {
    throw new ValidationError("Missing required fields");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid Email");
  }
};

export const checkOtpRestrictions = async (email: string, next: NextFunction) => {
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
};

export const trackOtpRequests = async (email: string, next: NextFunction) => {
  const otpRequestLKey = `otp_request_count:${email}`;
  const otpRequests = parseInt((await redis.get(otpRequestLKey)) || "0");

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
    return next(new ValidationError("Too many OTP requests. Please wait 1 hour before requesting again."));
  }

  await redis.set(otpRequestLKey, otpRequests + 1, "EX", 3600);
};

export const sendOtp = async (name: string, email: string, template: string) => {
  const otp = crypto.randomInt(1000, 9999).toString();

  const subject = "Verify Your Email";
  await sendEmail(email, subject, template, { name, otp });

  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};
