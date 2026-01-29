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
export async function getSellerInfo(req: Request, res: Response, next: NextFunction) {
  const shopId = req.params.id;
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    const followersCount = await prisma.follower.count({ where: { shopId: shop?.id } });

    return res.status(200).json({ success: true, shop, followersCount });
  } catch (error) {
    return next();
  }
}

// Get seller's products (public preview)
export async function getSellerProducts(req: any, res: Response, next: NextFunction) {
  const shopId = req.query.id!;

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

// Get seller events (public preview)
export async function getSellerEvents(req: any, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const shopId = req.query.id!;
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
