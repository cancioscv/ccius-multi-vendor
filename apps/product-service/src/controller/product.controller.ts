import { prisma } from "@e-com/db";
import { NextFunction, Request, Response } from "express";

// Get categories
export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await prisma.siteConfig.findFirst();
    if (!config) {
      return res.status(404).json({ message: "Categories not found" });
    }

    return res.status(200).json({ categories: config.categories, subCategories: config.subCategories });
  } catch (error) {
    return next(error);
  }
}
