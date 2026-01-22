import { Response, NextFunction } from "express";
import { AuthError } from "../error-handler/app-error.js";

export function isSeller(req: any, res: Response, next: NextFunction) {
  if (req.role !== "seller") {
    return next(new AuthError("Access granted to sellers only!"));
  }
  next();
}
export function isUser(req: any, res: Response, next: NextFunction) {
  if (req.role !== "user") {
    return next(new AuthError("Access granted to users only!"));
  }
  next();
}

export function isAdmin(req: any, res: Response, next: NextFunction) {
  if (req.role !== "admin") {
    return next(new AuthError("Access granted to Admin only!"));
  }
  next();
}
