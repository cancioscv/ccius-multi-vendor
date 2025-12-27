import { prisma } from "@e-com/db";
import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
import { CustomRequest } from "../types/user.js";

export async function isAuth(req: CustomRequest, res: Response, next: NextFunction) {
  // try {
  //   const token = req.cookies.access_token || req.headers.authorization?.split(" ")[1];

  //   if (!token) {
  //     return res.status(401).json({ message: "Unauthorized!. Token missing." });
  //   }

  //   const verifiedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as Role;

  //   if (!verifiedtoken) {
  //     return res.status(401).json({ message: "Unauthorized!. Invalid token." });
  //   }

  //   const user = await prisma.user.findUnique({ where: { id: verifiedtoken.id } });
  //   req.user = user;

  //   console.log("lknaskdhklajhsdkhakdjasd", user);

  //   if (!user) {
  //     return res.status(401).json({ message: "User not found." });
  //   }

  //   return next();
  // } catch (error) {
  //   return res.status(500).json({ message: "Internal Server Error." });
  // }

  // Get token from Authorization header or cookies
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { id: string; role: "user" | "seller" };

    // Fetch user from database with Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    // Attach user to request
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
