import { Response, NextFunction } from "express";
import { AuthError } from "../error-handler/app-error.js";
import { UserRole } from "@e-com/db";

export function isSeller(req: any, res: Response, next: NextFunction) {
  if (req.role !== UserRole.SELLER) {
    return next(new AuthError("Access granted to sellers only!"));
  }
  next();
}
export function isUser(req: any, res: Response, next: NextFunction) {
  if (req.role !== UserRole.USER) {
    return next(new AuthError("Access granted to users only!"));
  }
  next();
}

export function isAdmin(req: any, res: Response, next: NextFunction) {
  if (req.role !== UserRole.ADMIN) {
    return next(new AuthError("Access granted to Admin only!"));
  }
  next();
}
