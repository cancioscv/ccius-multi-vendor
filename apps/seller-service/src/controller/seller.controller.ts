import { NotificationType, prisma } from "@e-com/db";
import { AuthError, ForbiddenError, imageKitClient, NotFoundError, ValidationError } from "@e-com/libs";
import { NextFunction, Response, Request } from "express";

// Delete shop and its seller (soft delete)
export async function deleteShopAndSeller(req: any, res: Response, next: NextFunction) {
  const sellerId = req.seller?.id;
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { shop: true },
    });

    if (!seller || !seller.shop) {
      return next(new NotFoundError("Seller or Shop not found."));
    }

    // 28 days from now
    const deletedAt = new Date();
    deletedAt.setDate(deletedAt.getDate() + 28);

    // Soft delete both Seller and Shop.   // Verify this delete, maybe use Cascade?
    await prisma.$transaction([
      prisma.seller.update({
        where: { id: sellerId },
        data: {
          isDeleted: true,
          deletedAt,
        },
      }),
      prisma.shop.update({
        where: { id: seller.shop.id },
        data: {
          isDeleted: true,
          deletedAt,
        },
      }),
    ]);

    return res.status(200).json({
      message: "Shop and its Seller marked for deletion. It will permanently be deleted in 28 days.",
    });
  } catch (error) {
    return next(error);
  }
}

// Restore shop and its seller
export async function restoreShopAndSeller(req: any, res: Response, next: NextFunction) {
  const sellerId = req.seller?.id;
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        shop: true,
      },
    });

    if (!seller || !seller.shop) {
      return next(new NotFoundError("Seller or Shop not found."));
    }

    if (!seller.isDeleted || !seller.deletedAt || !seller.shop.isDeleted) {
      new ForbiddenError("Seller or Shop is not marked for deletion.");
    }

    const now = new Date();
    const deletedAt = seller?.deletedAt ? new Date(seller.deletedAt) : null;

    if (now > deletedAt!) {
      return next(new ForbiddenError("Cannot restore. The 28-day recovery has expired."));
    }

    // Restore both seller and shop
    await prisma.$transaction([
      prisma.seller.update({
        where: { id: sellerId },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      }),
      prisma.shop.update({
        where: { id: seller.shop.id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      }),
    ]);

    return res.status(200).json({ message: "Shop and Seller have been successfully restored." });
  } catch (error) {
    return next(error);
  }
}

// Uplooad Image
export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  const { file, fileName, folder } = req.body;
  try {
    if (!file || !fileName || !folder) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Upload image to imagekit
    const uploadResponse = await imageKitClient.upload({
      file,
      fileName,
      folder,
    });

    return res.status(201).json({
      success: true,
      fileId: uploadResponse.fileId,
      url: uploadResponse.url,
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    return next(error);
  }
}

// Update Avatar and Cover picture
export async function updateProfilePicture(req: any, res: Response, next: NextFunction) {
  const { editType, imageUrl } = req.body;
  try {
    if (!editType || !imageUrl) {
      return next(new ValidationError("Missing required fields."));
    }

    // Ensure the seller is authenticated
    if (!req.seller?.id) {
      return next(new AuthError("Only Seller can update profile pictures."));
    }

    const updatedField = editType === "cover" ? { coverBanner: imageUrl } : { avatar: imageUrl };

    // Update seller's profile
    const updatedSeller = await prisma.shop.update({
      where: {
        sellerId: req.seller?.id,
      },
      data: updatedField,
      select: {
        id: true,
        avatar: true,
        coverBanner: true,
      },
    });

    return res.status(200).json({
      success: true,
      updatedSeller, // Watch: This updatedSeller is not just anywhere
      message: `${editType === "cover" ? "Cover picture" : "Avatar"} updated successfully`,
    });
  } catch (error) {
    return next(error);
  }
}

// Edit seller profil/shop profile?
export async function editSellerShop(req: any, res: Response, next: NextFunction) {
  try {
    const { name, bio, address, openingHours, website, socialLinks } = req.body;

    if (!name || !bio || !address || !openingHours || !website || !socialLinks) {
      return next(new ValidationError("All fields are required."));
    }

    // Ensure the seller is authenticated
    if (!req.seller?.id) {
      return next(new AuthError("Only Sellers can edit their profile."));
    }

    // Check if the Shop exists for the Seller
    const existingShop = await prisma.shop.findUnique({
      where: { sellerId: req.seller?.id },
    });

    if (!existingShop) {
      return next(new ValidationError("Shop not found for this seller."));
    }

    // Update the shop profile
    const updatedShop = await prisma.shop.update({
      where: { sellerId: req.seller?.id },
      data: {
        name,
        bio,
        address,
        openingHours,
        website,
        socialLinks,
      },
      select: { id: true, name: true, bio: true, address: true, openingHours: true, website: true, socialLinks: true },
    });

    return res.status(200).json({
      success: true,
      updatedShop, // Watch: This is also used nowhere
      message: "Shop profile updated successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

// Get seller info (public preview)
// Updated to include aggregated review stats on the shop payload so the
// Reviews tab can display the avg rating and distribution immediately.
export async function getSellerInfo(req: Request, res: Response, next: NextFunction) {
  const shopId = req.params.id;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        // Include only the first 5 reviews for the initial SSR render.
        // The client paginates the rest via GET /seller/api/shop-reviews/:shopId
        reviews: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const followersCount = await prisma.follower.count({ where: { shopId: shop?.id } });

    // ── Aggregated rating stats across ALL reviews ──────────────────────────
    const allRatings = await prisma.shopReview.findMany({
      where: { shopId: shop?.id ?? "" },
      select: { rating: true },
    });

    const reviewCount = allRatings.length;
    const avgRating = reviewCount === 0 ? 0 : allRatings.reduce((acc, r) => acc + r.rating, 0) / reviewCount;

    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (reviewCount > 0) {
      allRatings.forEach((r) => {
        const star = Math.round(r.rating);
        if (star >= 1 && star <= 5) {
          ratingCounts[star] = (ratingCounts[star] || 0) + 1;
        }
      });
      Object.keys(ratingDistribution).forEach((key) => {
        const star = Number(key);
        ratingDistribution[star] = Math.round(((ratingCounts[star] || 0) / reviewCount) * 100);
      });
    }

    return res.status(200).json({
      success: true,
      shop: {
        ...shop,
        reviewCount,
        avgRating,
        ratingDistribution,
        ratingCounts,
      },
      followersCount,
    });
  } catch (error) {
    return next();
  }
}

// Get seller's products (public preview)
export async function getSellerProducts(req: any, res: Response, next: NextFunction) {
  const shopId = req.params.id!;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          startingDate: null,
          shopId,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          images: true,
          shop: true,
          reviews: true,
        },
      }),
      prisma.product.count({
        where: {
          startingDate: null,
          shopId,
        },
      }),
    ]);

    const dataWithSummarizedReviews = products.map((product) => ({
      ...product,
      reviewCount: product.reviews.length,
      reviewRating: product.reviews.length === 0 ? 0 : product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length,
    }));

    return res.status(200).json({
      success: true,
      products: dataWithSummarizedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Get seller events (public preview)
export async function getSellerOffers(req: any, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const shopId = req.params.id!;
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          startingDate: {
            not: null,
          },
          shopId,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          images: true,
        },
      }),
      prisma.product.count({
        where: {
          startingDate: null,
          shopId,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Follow a shop
export async function followShop(req: any, res: Response, next: NextFunction) {
  const { shopId } = req.body;
  const userId = req.user?.id;
  try {
    if (!shopId) {
      return next(new ValidationError("Shop Id is required."));
    }

    // Check is shop is already followed up
    const existingFollow = await prisma.follower.findFirst({
      where: {
        shopId,
        userId,
      },
    });

    if (existingFollow) {
      return res.status(200).json({ success: true, message: "Already following this shop." });
    }

    // Create follow. TODO: Verify well this model.
    const follow = await prisma.follower.create({
      data: {
        userId,
        shopId,
      },
    });

    return res.status(201).json({
      success: true,
      follow,
      message: "Shop followed.",
    });
  } catch (error) {
    return next(error);
  }
}

// Unfollow a ship
export async function unfollowShop(req: any, res: Response, next: NextFunction) {
  const { shopId } = req.body;
  const userId = req.user?.id;
  try {
    if (!shopId) {
      return next(new ValidationError("Shop Id is required."));
    }

    // Check is shop is already followed up
    const existingFollow = await prisma.follower.findFirst({
      where: {
        shopId,
        userId,
      },
    });

    if (!existingFollow) {
      return res.status(200).json({ success: false, message: "You are not following this shop." });
    }

    // Delete follow.
    await prisma.follower.delete({
      where: {
        id: existingFollow.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Shop unfollowed",
    });
  } catch (error) {
    return next(error);
  }
}

// Check if shop is being followed
export async function isFollowing(req: any, res: Response, next: NextFunction) {
  const shopId = req.params.id;
  const userId = req.user?.id;
  try {
    if (!shopId) {
      return next(new ValidationError("Shop Id is required."));
    }

    // Check is shop is already followed up
    const isFollowing = await prisma.follower.findFirst({
      where: {
        shopId,
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      isFollowing,
    });
  } catch (error) {
    return next(error);
  }
}

// Get seller's notifications
export async function getSellerNotifications(req: any, res: Response, next: NextFunction) {
  const sellerId = req.seller?.id;

  try {
    if (!sellerId) {
      return next(new ValidationError("Seller Id is required."));
    }

    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: sellerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return next(error);
  }
}

// Mark notification as read
export async function markNotificationAsRead(req: any, res: Response, next: NextFunction) {
  const { notificationId } = req.body;
  try {
    if (!notificationId) {
      return next(new ValidationError("Notification Id is required"));
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: NotificationType.IS_READ,
      },
    });

    return res.status(201).json({ success: true, notification });
  } catch (error) {
    return next();
  }
}

// get shop categories
export async function getShopCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await prisma.siteConfig.findFirst({ select: { categories: true } });
    if (!config) return res.status(404).json({ message: "Config not found" });
    return res.status(200).json({ categories: config.categories as string[] });
  } catch (error) {
    return next(error);
  }
}

// ─── getShopReviews.ts ─────────────────────────────────────────────────────────
// GET /seller/api/shop-reviews/:shopId?page=1&limit=5&sort=most_recent
// Now returns isVerifiedBuyer on each review (computed from orders).
// Paginated + sortable shop reviews for the Reviews tab.

export async function getShopReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { shopId } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || REVIEWS_PER_PAGE));
    const sort = (req.query.sort as string) || "most_recent";
    const skip = (page - 1) * limit;

    // ── Map sort option to Prisma orderBy ─────────────────────────────────────
    let orderBy: Record<string, any> = { createdAt: "desc" }; // most_recent default
    if (sort === "highest_rating") orderBy = { rating: "desc" };
    if (sort === "lowest_rating") orderBy = { rating: "asc" };
    // most_helpful: now uses the actual helpfulCount field on ShopReview
    if (sort === "most_helpful") orderBy = { helpfulCount: "desc" };

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        where: { shopId },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.shopReview.count({ where: { shopId } }),
    ]);

    // ── Annotate each review with isVerifiedBuyer ─────────────────────────────
    // Batch: get all unique userIds from this page of reviews, then check orders once.
    const reviewerIds = [...new Set(reviews.map((r) => r.userId))];
    const buyerOrders = await prisma.order.findMany({
      where: { shopId, userId: { in: reviewerIds } },
      select: { userId: true },
      distinct: ["userId"],
    });
    const buyerSet = new Set(buyerOrders.map((o) => o.userId));

    // ── Annotate userHasVotedHelpful per review for the current user ────────────
    // Only meaningful when userId is present (authenticated requests).
    // For public (unauthenticated) requests we skip this query entirely.
    const requestUserId = (req as any).user?.id ?? null;
    let votedSet = new Set<string>();
    if (requestUserId) {
      const reviewIds = reviews.map((r) => r.id);
      const votes = await prisma.shopReviewHelpful.findMany({
        where: { userId: requestUserId, reviewId: { in: reviewIds } },
        select: { reviewId: true },
      });
      votedSet = new Set(votes.map((v) => v.reviewId));
    }

    const annotatedReviews = reviews.map((r) => ({
      ...r,
      isVerifiedBuyer: buyerSet.has(r.userId),
      userHasVotedHelpful: votedSet.has(r.id),
    }));

    // ── Rating distribution for this shop ─────────────────────────────────────
    const allRatings = await prisma.shopReview.findMany({
      where: { shopId },
      select: { rating: true },
    });

    const avgRating = allRatings.length === 0 ? 0 : allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length;

    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (allRatings.length > 0) {
      allRatings.forEach((r) => {
        const star = Math.round(r.rating);
        if (star >= 1 && star <= 5) {
          ratingCounts[star] = (ratingCounts[star] || 0) + 1;
        }
      });
      Object.keys(ratingDistribution).forEach((key) => {
        const star = Number(key);
        ratingDistribution[star] = Math.round(((ratingCounts[star] || 0) / allRatings.length) * 100);
      });
    }

    return res.status(200).json({
      success: true,
      reviews: annotatedReviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgRating,
      ratingDistribution,
      ratingCounts,
    });
  } catch (error) {
    return next(error);
  }
}

// ─── createShopReview.ts ───────────────────────────────────────────────────────
// POST /seller/api/shop-reviews
// ── Option C: any logged-in user can leave a review.
//    Buyers are flagged with isVerifiedBuyer = true automatically.
//    The `isProtected` middleware already ensures only logged-in users can POST.

export async function createShopReview(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const {
    shopId,
    rating,
    reviews: reviewTitle,
    comment,
    // isVerifiedBuyer
  } = req.body;

  // TODO: optionally add @@unique([userId, shopId]) to ShopReview in schema
  //       to prevent a user submitting more than one review per shop.

  try {
    // ── Double-check buyer status server-side (never trust client alone) ────────
    // Even if the client sends isVerifiedBuyer=true, we verify it here.
    const purchaseCount = await prisma.order.count({
      where: { userId, shopId },
    });
    const verifiedBuyer = purchaseCount > 0;

    const review = await prisma.shopReview.create({
      data: {
        userId,
        shopId,
        rating: Number(rating),
        reviews: reviewTitle ?? null, // ShopReview.reviews = title/summary
        // NOTE: add `comment String?` to ShopReview in your Prisma schema
        // if you want to store the long-form body separately from the title.
        // Until then, concatenate them or store only reviews (title).
        comment: comment ?? null,
      },
    });

    // ── Update the shop's aggregate rating ────────────────────────────────────
    const allRatings = await prisma.shopReview.findMany({
      where: { shopId },
      select: { rating: true },
    });
    const newAvg = allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length;

    await prisma.shop.update({
      where: { id: shopId },
      data: { ratings: newAvg },
    });

    return res.status(201).json({ success: true, data: review, isVerifiedBuyer: verifiedBuyer });
  } catch (error) {
    return next(error);
  }
}

// ─── updateShopReview.ts ───────────────────────────────────────────────────────
// PUT /seller/api/shop-reviews/:reviewId
// Follows the same pattern as updateReview for products.

export async function updateShopReview(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { reviewId } = req.params;
  const { rating, reviews: reviewTitle, comment } = req.body;

  try {
    // Find existing shop review
    const existing = await prisma.shopReview.findFirst({
      where: { id: reviewId, userId },
    });

    if (!existing) {
      return next(new ValidationError("Review not found"));
    }

    if (existing.userId !== userId) {
      return next(new AuthError("You are not allowed to update this review"));
    }

    const updated = await prisma.shopReview.update({
      where: { id: reviewId },
      data: {
        rating: rating !== undefined ? Number(rating) : existing.rating,
        reviews: reviewTitle ?? existing.reviews,
        comment: comment !== undefined ? comment : (existing as any).comment,
        updateAt: new Date(),
      },
    });

    // ── Re-calculate shop aggregate rating ────────────────────────────────────
    if (rating !== undefined) {
      const allRatings = await prisma.shopReview.findMany({
        where: { shopId: existing.shopId ?? "" },
        select: { rating: true },
      });
      const newAvg = allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length;

      await prisma.shop.update({
        where: { id: existing.shopId ?? "" },
        data: { ratings: newAvg },
      });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
}

// ─── getShopReview.ts ──────────────────────────────────────────────────────────
// GET /seller/api/shop-review/:shopId   (requires auth)
// Returns the current user's review for a given shop (if any).

export async function getShopReview(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { shopId } = req.params;

  try {
    if (!shopId || !userId) return res.status(200).json({ success: true, review: null });

    const review = await prisma.shopReview.findFirst({
      where: { userId, shopId },
    });

    return res.status(200).json({ success: true, review });
  } catch (error) {
    return next(error);
  }
}

// ─── hasPurchasedFromShop.ts ───────────────────────────────────────────────────
// GET /seller/api/has-purchased/:shopId    (requires auth via isProtected)
// Used by the frontend (Option C) to decide whether to show the "Verified buyer"
// badge in the Write Review modal before submission.

export async function hasPurchasedFromShop(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { shopId } = req.params;

  try {
    const count = await prisma.order.count({
      where: { userId, shopId },
    });
    return res.status(200).json({ success: true, hasPurchased: count > 0 });
  } catch (error) {
    return next(error);
  }
}

// ─── toggleShopReviewHelpful.ts ────────────────────────────────────────────────
// POST   /seller/api/shop-reviews/:reviewId/helpful  → mark helpful
// DELETE /seller/api/shop-reviews/:reviewId/helpful  → unmark helpful
//
// We store votes in a ShopReviewHelpful join model (see schema note below).
// A user can only vote once per review (enforced by @@unique + try/catch).
// helpfulCount on ShopReview is updated atomically for fast reads.
//
// ── PRISMA SCHEMA to add ─────────────────────────────────────────────────────
// model ShopReviewHelpful {
//   id       String @id @default(auto()) @map("_id") @db.ObjectId
//   userId   String @db.ObjectId
//   reviewId String @db.ObjectId
//   createdAt DateTime @default(now())
//   @@unique([userId, reviewId])   // one vote per user per review
// }
// Also add to ShopReview:
//   helpfulCount Int @default(0)
//   helpfulVotes ShopReviewHelpful[]
// ─────────────────────────────────────────────────────────────────────────────

export async function markReviewHelpful(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { reviewId } = req.params;

  try {
    // createMany not available in MongoDB driver — use create with try/catch
    // for the @@unique constraint
    await prisma.shopReviewHelpful.create({
      data: { userId, reviewId },
    });

    // Increment helpfulCount atomically
    await prisma.shopReview.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
    });

    return res.status(200).json({ success: true, voted: true });
  } catch (error: any) {
    // Duplicate key = user already voted. Return 200 (idempotent).
    if (error?.code === "P2002") {
      return res.status(200).json({ success: true, voted: true, message: "Already voted" });
    }
    return next(error);
  }
}

export async function unmarkReviewHelpful(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const { reviewId } = req.params;

  try {
    // Delete the vote record
    const deleted = await prisma.shopReviewHelpful.deleteMany({
      where: { userId, reviewId },
    });

    if (deleted.count > 0) {
      // Only decrement if a record was actually removed
      await prisma.shopReview.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } },
      });
    }

    return res.status(200).json({ success: true, voted: false });
  } catch (error) {
    return next(error);
  }
}

// ─── ROUTES TO REGISTER ───────────────────────────────────────────────────────
// Add these to your seller router:
//
//   router.get("/shop-reviews/:shopId",               getShopReviews);                // public
//   router.get("/has-purchased/:shopId",             protect, hasPurchasedFromShop);   // auth
//   router.get("/shop-review/:shopId",               protect, getShopReview);           // auth
//   router.post("/shop-reviews",                     protect, createShopReview);        // auth
//   router.put("/shop-reviews/:reviewId",            protect, updateShopReview);        // auth
//   router.post("/shop-reviews/:reviewId/helpful",   protect, markReviewHelpful);       // auth
//   router.delete("/shop-reviews/:reviewId/helpful", protect, unmarkReviewHelpful);     // auth
//
// ── PRISMA SCHEMA NOTE ────────────────────────────────────────────────────────
// The existing ShopReview model already covers rating + reviews (String?).
// Optionally add these fields for a richer experience:
//
// model ShopReview {
//   ...existing fields...
//   comment      String?             // ← long-form body, separate from the title
//   helpfulCount Int    @default(0)  // ← for "Helpful (N)" voting
//   helpfulVotes ShopReviewHelpful[] // ← relation to vote records
// }
//
// model ShopReviewHelpful {
//   id        String   @id @default(auto()) @map("_id") @db.ObjectId
//   userId    String   @db.ObjectId
//   reviewId  String   @db.ObjectId
//   createdAt DateTime @default(now())
//   @@unique([userId, reviewId])  // one vote per user per review
// }

// ─── Constants (shared with frontend) ─────────────────────────────────────────
const REVIEWS_PER_PAGE = 5;
