import { Response, NextFunction } from "express";
import { AuthError } from "../error-handler/app-error.js";

export function isSeller(req: any, res: Response, next: NextFunction) {
  if (req.role !== "seller") {
    return next(new AuthError("Access granted to sellers only!"));
  }
}
export function isUser(req: any, res: Response, next: NextFunction) {
  if (req.role !== "user") {
    return next(new AuthError("Access granted to users only!"));
  }
}
