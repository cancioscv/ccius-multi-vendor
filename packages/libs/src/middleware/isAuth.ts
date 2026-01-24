import { prisma } from "@e-com/db";
import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
// import { CustomRequest } from "../types/user.js";

export async function isAuth(req: any, res: Response, next: NextFunction) {
  // Get token from Authorization header or cookies
  const token = req.cookies["access_token"] || req.cookies["seller_access_token"] || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { id: string; role: "user" | "seller" };

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized!. Invalid token." });
    }

    let account;

    if (decoded.role === "user") {
      account = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      // Attach user to request
      req.user = account;
    } else if (decoded.role === "seller") {
      account = await prisma.seller.findUnique({
        where: { id: decoded.id },
        include: { shop: true },
      });

      // Attach seller to request
      req.seller = account;
    }

    if (!account) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    req.role = decoded.role;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}
