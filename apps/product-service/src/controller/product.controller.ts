import { AuthError, imageKitClient, NotFoundError, ValidationError } from "@e-com/libs";
import { prisma } from "@e-com/db";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
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

// Create discount code
export async function createDiscountCode(req: any, res: Response, next: NextFunction) {
  try {
    const { publicName, discountType, discountValue, discountCode } = req.body;

    const existDiscountCode = await prisma.discountCode.findUnique({ where: { discountCode } });

    if (existDiscountCode) {
      return next(new ValidationError("Discount code already available, please use a different code."));
    }

    const discount_code = await prisma.discountCode.create({
      data: {
        publicName,
        discountType,
        discountCode,
        discountValue: parseFloat(discountValue),
        sellerId: req.seller.id,
      },
    });

    return res.status(201).json({ success: true, discount_code });
  } catch (error) {
    return next(error);
  }
}

// Get discount code
export async function getDiscountCodes(req: any, res: Response, next: NextFunction) {
  try {
    const discountCodes = await prisma.discountCode.findMany({ where: { sellerId: req.seller.id } });

    return res.status(201).json({ success: true, discountCodes });
  } catch (error) {
    return next(error);
  }
}

// Delete discount code
export async function deleteDiscountCode(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const sellerId = req.seller?.id;

    const discountToDelete = await prisma.discountCode.findUnique({ where: { id }, select: { id: true, sellerId: true } });

    if (!discountToDelete) {
      return next(new NotFoundError("Discound code not found."));
    }

    if (discountToDelete.sellerId !== sellerId) {
      return next(new ValidationError("Unauthoirized access."));
    }

    await prisma.discountCode.delete({ where: { id } });

    return res.status(200).json({ message: "Discount code successfully deletd." });
  } catch (error) {
    return next(error);
  }
}

// Upload product image
export async function uploadProductImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { fileName } = req.body;
    if (!fileName) return;

    const response = await imageKitClient.upload({
      file: fileName,
      fileName: `product-${Date.now()}.jpg`,
      folder: "/products",
    });

    return res.status(201).json({ fileUrl: response.url, fileId: response.fileId });
  } catch (error) {
    return next(error);
  }
}

// Delete product image
export async function deleteProductImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { fileId } = req.body;

    const response = await imageKitClient.deleteFile(fileId);
    return res.status(201).json({ success: true, response });
  } catch (error) {
    return next(error);
  }
}

// Create product
export async function createProduct(req: any, res: Response, next: NextFunction) {
  try {
    const {
      title,
      description,
      detailedDescription,
      warranty,
      customSpecifications,
      customProperties = {},
      slug,
      tags,
      cashOnDelivery,
      brand,
      videoUrl,
      category,
      subCategory,
      colors = [],
      sizes = [],
      discountCode,
      stock,
      salePrice,
      regularPrice,
      images = [],
    } = req.body;

    if (!title || !slug || !description || !category || !subCategory || !salePrice || !images || !tags || !stock || !regularPrice) {
      return next(new ValidationError("Missing required fields."));
    }

    if (!req.seller.id) {
      return next(new AuthError("Only seller can create product."));
    }
  } catch (error) {
    return next(error);
  }
}
