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
      discountCodeData,
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
    const slugExist = await prisma.product.findUnique({ where: { slug } });
    if (slugExist) {
      return next(new ValidationError("Slug already exist. Please provide a different slug."));
    }

    // function checkImage(images) {
    //   return images?.every((image: any) => {
    //     if (image !== null) {
    //       return {
    //         fileId: image.fileId,
    //         url: image.filedUrl,
    //       };
    //     }
    //   });
    // }

    // TODO: Unique constraint failed on the constraint: `Image_userId_key`
    const data = {
      shopId: req.seller?.shop?.id,
      title,
      description,
      detailedDescription,
      warranty,
      customSpecifications: customSpecifications || {},
      customProperties: customProperties || {},
      slug,
      tags: Array.isArray(tags) ? tags : tags.split(","),
      cashOnDelivery,
      brand,
      videoUrl,
      category,
      subCategory,
      colors: colors || [],
      sizes: sizes || [],
      discountCodes: discountCodeData?.map((codeId: string) => codeId),
      stock: parseInt(stock),
      salePrice: parseFloat(salePrice),
      regularPrice: parseFloat(regularPrice),
      images: {
        create: images
          ?.filter((img: any) => img && img.fileId && img.fileUrl)
          .map((image: any) => ({
            fileId: image.fileId,
            url: image.fileUrl,
          })),
      },
    };

    const newProduct = await prisma.product.create({
      data,
      include: { images: true },
    });

    return res.status(201).json({ success: true, newProduct });
  } catch (error) {
    return next(error);
  }
}

// Get logged in seller
export async function getSellerProducts(req: any, rese: Response, next: NextFunction) {
  try {
    const products = await prisma.product.findMany({
      where: {
        shopId: req?.seller?.shop?.id,
      },
      include: {
        images: true,
      },
    });

    return rese.status(200).json({ success: true, products });
  } catch (error) {
    return next(error);
  }
}

// Delete product
export async function deleteProduct(req: any, res: Response, next: NextFunction) {
  try {
    // Check if the product is owned by the seller
    // TODO: Rework all this part, i dont like it. Althoug that is so because it is restorable
    const { productId } = req.params;
    const sellerId = req.seller?.shop?.id;
    if (!productId || !sellerId) return;

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, shopId: true, isDeleted: true } });

    if (!product) {
      return next(new ValidationError("Product not found."));
    }
    if (product.shopId !== sellerId) {
      return next(new ValidationError("Unauthorized too delete this product."));
    }

    if (product.isDeleted) {
      return next(new ValidationError("Product is already deleted."));
    }

    const deletedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours.
      },
    });
    return res.status(200).json({
      merssage: "Product is scheduled to be deleted in 24 hours. You can restore it within this time.",
      deletedAt: deletedProduct.deletedAt,
    });
  } catch (error) {
    return next(error);
  }
}

// Restore product

export async function restoreProduct(req: any, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;

    const sellerId = req.seller?.shop?.id;

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        shopId: true,
        isDeleted: true,
      },
    });

    if (!product) {
      return next(new ValidationError("Product not found."));
    }

    if (product.shopId !== sellerId) {
      return next(new ValidationError("Unauthorized!"));
    }

    if (!product.isDeleted) {
      return res.status(400).json({ message: "Product is not marked as 'deleted' state" });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isDeleted: false, deletedAt: null },
    });

    return res.status(200).json({ message: "Product succesfully restored." });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!!", error });
  }
}
