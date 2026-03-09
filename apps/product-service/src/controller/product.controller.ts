import { AuthError, imageKitClient, NotFoundError, ValidationError } from "@e-com/libs";
import { Prisma, prisma } from "@e-com/db";
import { NextFunction, Request, Response } from "express";
import stripe from "../utils/stripe.js";

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
        discountType: discountType.toUpperCase(),
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

    //  Upload all images to imagekit
    // const uploadedImages = await Promise.all(
    //   images.map(async (img: any, index: number) => {
    //     if (!img.base64) return null;

    //     const uploadResponse = await imageKitClient.upload({
    //       file: img.base64,
    //       fileName: `product-${Date.now()}-${index}.jpg`,
    //       folder: "/products",
    //     });

    //     return {
    //       fileId: uploadResponse.fileId,
    //       url: uploadResponse.url,
    //     };
    //   })
    // );

    // TODO: Unique constraint failed on the constraint: `Image_userId_key`. I can't create a second product with same userId
    const data = {
      shopId: req.seller?.shop?.id,
      title,
      description,
      detailedDescription,
      warranty,
      customSpecifications: customSpecifications,
      customProperties: customProperties,
      slug,
      tags: Array.isArray(tags) ? tags : tags.split(","),
      cashOnDelivery,
      brand,
      videoUrl,
      category,
      subCategory,
      colors: colors || [],
      sizes: sizes || [],
      discountCodes: discountCodeData?.map((codeId: string) => codeId) || [],
      stock: parseInt(stock),
      salePrice: parseFloat(salePrice),
      regularPrice: parseFloat(regularPrice),
      startingDate: req.body.startingDate ? new Date(req.body.startingDate) : null,
      endingDate: req.body.endingDate ? new Date(req.body.endingDate) : null,
      // images: uploadedImages.filter(Boolean), // removes nulls
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

// Get logged-in seller products
export async function getShopProducts(req: any, res: Response, next: NextFunction) {
  try {
    const products = await prisma.product.findMany({
      where: {
        shopId: req?.seller?.shop?.id,
      },
      include: {
        images: true,
      },
    });

    return res.status(200).json({ success: true, products });
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

// Create product review
export async function createReview(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { rating, comment, title, productId } = req.body;

  // TODO: - find Product to create review?
  // TODO: - find existing review for that product. Below already implemented

  try {
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        title,
        productId,
        userId,
      },
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    return next(error);
  }
}

// Update product review
export async function updateReview(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { productId, rating, comment, title } = req.body;

  try {
    // Find existing product's review
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (!existingReview) {
      return next(new ValidationError("Review not found"));
    }

    if (existingReview.userId !== userId) {
      return next(new AuthError("You are not allowed to update this review"));
    }

    const updatedReview = await prisma.review.update({
      data: {
        rating,
        comment,
        title,
      },
      where: {
        id: existingReview?.id,
      },
    });

    return res.status(201).json({ success: true, data: updatedReview });
  } catch (error) {
    return next(error);
  }
}

// Gt product review
export async function getReview(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { productId } = req.params;

  try {
    if (!productId || !userId) return;

    const review = await prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    return res.status(200).json({ success: true, review });
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

// Get seller stripe information
export async function getStripeAccount(req: any, res: Response, next: NextFunction) {
  try {
    const sellerData = await prisma.seller.findUnique({
      where: { id: req.seller?.id },
      select: { stripeId: true },
    });

    if (!sellerData?.stripeId) {
      return next(new ValidationError("No Stripe account linked!"));
    }

    // Fetch Stripe account details
    const stripeAccount = await stripe.accounts.retrieve(sellerData.stripeId);

    // Fetch last payout if available
    const payouts = await stripe.payouts.list({ limit: 1 }, { stripeAccount: stripeAccount.id });

    const lastPayouts = payouts?.data.length ? new Date(payouts.data[0].created * 1000).toLocaleDateString() : null;

    return res.status(200).json({
      success: true,
      stripeAccount: {
        id: stripeAccount.id,
        email: stripeAccount.email || "Not available",
        business_name:
          stripeAccount.business_profile?.name || stripeAccount.individual?.first_name + " " + stripeAccount.individual?.last_name || "N/A",
        country: stripeAccount.country || "Unknown",
        payouts_enabled: stripeAccount.payouts_enabled,
        charges_enabled: stripeAccount.charges_enabled,
        last_payouts: lastPayouts || "No payouts yet.",
        dashboard_url: `https://connect.stripe.com/app/express_dashboard/${stripeAccount.id}`,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Get all products
export async function getAllProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;

    const baseFilter = {
      OR: [{ startingDate: null }, { endingDate: null }],
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      type === "latest" ? { createdAt: "desc" as Prisma.SortOrder } : { totalSales: "desc" as Prisma.SortOrder }; // Listing the newest otherwise most popular products

    const [products, total, top10Products] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        include: {
          images: true,
          shop: true,
          reviews: true,
        },
        where: baseFilter,
        orderBy: {
          totalSales: "desc",
        },
      }),

      prisma.product.count({ where: baseFilter }),
      prisma.product.findMany({
        take: 10,
        where: baseFilter,
        orderBy,
      }),
    ]);

    const dataWithSummarizedReviews = products.map((product) => ({
      ...product,
      reviewCount: product.reviews.length,
      reviewRating: product.reviews.length === 0 ? 0 : product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length,
    }));

    return res.status(200).json({
      products: dataWithSummarizedReviews.map((product) => ({ ...product })),
      top10By: type === "latest" ? "latest" : "topSales",
      top10Products,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
}

// Get product
export async function getProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: req.params.slug,
      },
      include: {
        images: true,
        shop: true,
        reviews: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!product) {
      return next(new NotFoundError("Product was not found"));
    }

    const dataWithSummarizedReviews = {
      ...product,
      reviewCount: product?.reviews.length,
      reviewRating: product?.reviews.length === 0 ? 0 : product?.reviews.reduce((acc, review) => acc + review.rating, 0) / product?.reviews?.length,
    };

    const ratingDistribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (dataWithSummarizedReviews.reviews.length > 0) {
      dataWithSummarizedReviews.reviews.forEach((review) => {
        const rating = review.rating;

        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        }
      });

      Object.keys(ratingDistribution).forEach((key) => {
        const rating = Number(key);
        const count = ratingDistribution[rating] || 0;
        ratingDistribution[rating] = Math.round((count / product.reviews.length) * 100);
      });
    }

    return res.status(201).json({ success: true, product: { ...dataWithSummarizedReviews, ratingDistribution } });
  } catch (error) {
    return next(error);
  }
}

// Get filtered products
export async function getFilteredProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { priceRange = [0, 10000], categories = [], colors = [], sizes = [], page = 1, limit = 12 } = req.query;

    const parsedPriceRange = typeof priceRange === "string" ? priceRange.split(",").map(Number) : [0, 10000];
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {
      salePrice: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
      startingDate: null,
    };

    if (categories && String(categories).length > 0) {
      filters.category = {
        in: Array.isArray(categories) ? categories : String(categories).split(","),
      };
    }
    if (colors && (colors as string[]).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : String(colors).split(","),
      };
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : String(sizes).split(","),
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          shop: true,
          reviews: true,
        },
      }),
      prisma.product.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    const dataWithSummarizedReviews = products.map((product) => ({
      ...product,
      reviewCount: product.reviews.length,
      reviewRating: product.reviews.length === 0 ? 0 : product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length,
    }));

    return res.status(200).json({
      products: dataWithSummarizedReviews,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Get filtered offers
export async function getFilteredOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const { priceRange = [0, 10000], categories = [], colors = [], sizes = [], page = 1, limit = 12 } = req.query;

    const parsedPriceRange = typeof priceRange === "string" ? priceRange.split(",").map(Number) : [0, 10000];
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {
      salePrice: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
      NOT: {
        startingDate: null,
      },
    };

    if (categories && String(categories).length > 0) {
      filters.category = {
        in: Array.isArray(categories) ? categories : String(categories).split(","),
      };
    }
    if (colors && (colors as string[]).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          shop: true,
          reviews: true,
        },
      }),
      prisma.product.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    const dataWithSummarizedReviews = products.map((product) => ({
      ...product,
      reviewCount: product.reviews.length,
      reviewRating: product.reviews.length === 0 ? 0 : product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length,
    }));

    return res.status(200).json({
      products: dataWithSummarizedReviews,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Get filtered shops
export async function getFilteredShops(req: Request, res: Response, next: NextFunction) {
  try {
    const { categories = [], countries = [], page = 1, limit = 12 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {};

    if (categories && String(categories).length > 0) {
      filters.category = {
        in: Array.isArray(categories) ? categories : String(categories).split(","),
      };
    }

    if (countries && String(countries).length > 0) {
      filters.countries = {
        in: Array.isArray(countries) ? countries : String(countries).split(","),
      };
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          // sellers: true, // TODO: Find out why it does not work with this
          products: true,
          followers: true,
        },
      }),
      prisma.shop.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      shops,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Search products
export async function searchProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required." });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
}

// Get Top Shops
export async function getTopShops(req: Request, res: Response, next: NextFunction) {
  try {
    // Aggregate total sales per shop from order
    const topShopsData = await prisma.order.groupBy({
      by: ["shopId"],
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: 10,
    });

    // Fetch the corresponding Shop details
    const shopIds = topShopsData.map((item) => item.shopId);
    const shops = await prisma.shop.findMany({
      where: {
        id: {
          in: shopIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        coverBanner: true,
        address: true,
        ratings: true,
        followers: true,
        category: true,
      },
    });

    // Merge sales with shop data
    const enrichedShops = shops.map((shop) => {
      const salesData = topShopsData.find((s) => s.shopId === shop.id);
      return {
        ...shop,
        totalSales: salesData?._sum.total ?? 0,
      };
    });

    const top10Shops = enrichedShops.sort((a, b) => b.totalSales - a.totalSales).slice(0, 10);
    return res.status(200).json({ shops: top10Shops });
  } catch (error) {
    return next(error);
  }
}

// Get all Events/Offers
export async function getAllOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const baseFilter = {
      AND: [{ startingDate: { not: null } }, { endingDate: { not: null } }],
    };

    const [offers, total, top10BySales] = await Promise.all([
      prisma.product.findMany({
        where: baseFilter,
        skip,
        take: limit,
        include: {
          images: true,
          shop: true,
        },
        orderBy: {
          totalSales: "desc",
        },
      }),
      prisma.product.count({ where: baseFilter }),
      prisma.product.findMany({
        where: baseFilter,
        take: 10,
        orderBy: {
          totalSales: "desc",
        },
      }),
    ]);

    return res.status(200).json({
      offers,
      total,
      top10BySales,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch offers/events" });
    // return next(error);
  }
}

// Slug Validator
export async function slugValidator(req: Request, res: Response, next: NextFunction) {
  let { slug } = req.body;
  try {
    if (!slug || typeof slug !== "string") {
      return next(new ValidationError("Slug is required and must be a string."));
    }

    // Slugify manually (no slugify lib)
    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50); // cap to 50 chars

    let uniqueSlug = slug;
    let counter = 1;

    const findUniqueSlug = await prisma.product.findUnique({
      where: { slug: uniqueSlug },
    });

    while (findUniqueSlug) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return res.status(200).json({
      available: uniqueSlug === slug,
      slug: uniqueSlug,
    });
  } catch (error) {
    return next(error);
  }
}

// Get product analytics
export async function getProductAnalytics(req: Request, res: Response, next: NextFunction) {
  const productId = req.params.productId;
  try {
    const analytics = await prisma.productAnalytics.findUnique({
      where: { productId },
    });

    return res.status(200).json({ success: true, analytics });
  } catch (error) {
    return next(error);
  }
}
