import { prisma } from "@e-com/db";
import { AuthError, ForbiddenError, imageKitClient, NotFoundError, ValidationError } from "@e-com/libs";
import { NextFunction, Response, Request } from "express";

// Delete shop (soft delete)
export async function deleteShop(req: any, res: Response, next: NextFunction) {
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

    return res.status(200).json({ message: "Shop and its Seller marked for deletion. It will permanently be deleted in 28 days." });
  } catch (error) {
    return next(error);
  }
}

// Restore Shop
export async function restoreShop(req: any, res: Response, next: NextFunction) {
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
      url: uploadResponse.url, // Watch: This might be fileUrl
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
    if (!editType || imageUrl) {
      return next(new ValidationError("Missing required fields"));
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
      updatedSeller,
      message: `${editType === "cover" ? "Cover picture" : "Avatar"} updated successfully`,
    });
  } catch (error) {
    return next(error);
  }
}

// Edit seller profil/shop profile?
export async function editSellerProfile(req: any, res: Response, next: NextFunction) {
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
      updatedShop,
      message: "Shop profile updated successfully.",
    });
  } catch (error) {
    return next(error);
  }
}
