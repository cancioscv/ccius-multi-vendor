import { NextFunction, Request, Response } from "express";
import { checkOtpRestrictions, sendOtp, trackOtpRequests, validateRegistrationData } from "../utils/auth.helper.js";
import { ValidationError } from "@e-com/libs";
import { prisma } from "@e-com/db";

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
