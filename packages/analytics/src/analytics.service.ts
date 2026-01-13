import { prisma } from "@e-com/db";

export async function updateUserAnalytics(event: any) {
  try {
    const existingData = await prisma.userAnalytics.findUnique({
      where: {
        userId: event.userId,
      },
      select: { actions: true },
    });

    let updatedActions: any = existingData?.actions || [];

    const actionExists = updatedActions.some((entry: any) => entry.productId === event.productId && entry.action === event.action);

    // Always Store `product.view for recommendations`
    if (event.action === "product_view") {
      updatedActions.push({
        productId: event?.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: new Date(),
      });
    } else if (["add_to_cart", "add_to_wishlist"].includes(event.action) && !actionExists) {
      updatedActions.push({
        productId: event?.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: new Date(),
      });
    }

    // Remove `add_to_cart` when `remove_from_cart` is triggered
    else if (event.action === "remove_from_cart") {
      updatedActions = updatedActions.filter((entry: any) => !(entry.productId === event.productId && entry.action === "add_to_cart"));
    }

    // Remove `add_to_wishlist` when `remove_from_wishlist` is triggered
    else if (event.action === "remove_from_wishlist") {
      updatedActions = updatedActions.filter((entry: any) => !(entry.productId === event.productId && entry.action === "add_to_wishlist"));
    }

    // Keep only the last 100 actions (prevent overload)
    if (updatedActions.length > 100) {
      updatedActions.shift();
    }

    const extraFields: Record<string, any> = {};

    if (event.country) {
      extraFields.country = event.country;
    }
    if (event.city) {
      extraFields.city = event.city;
    }
    if (event.device) {
      extraFields.device = event.device;
    }

    // Update or create user analytics
    await prisma.userAnalytics.upsert({
      where: { userId: event.userId },
      update: {
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
      create: {
        userId: event?.userId,
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
    });

    await updateProductAnalytics(event);
  } catch (error) {
    console.error("Error storing user analytics", error);
  }
}

export async function updateProductAnalytics(event: any) {
  try {
    if (!event.productId) return;

    // Define update fields dynamically
    const updateFields: any = {};

    if (event.action === "product_view") updateFields.views = { increment: 1 };
    if (event.action === "add_to_cart") updateFields.addedToCart = { increment: 1 };
    if (event.action === "remove_from_cart") updateFields.addedToCart = { decrement: 1 };
    if (event.action === "add_to_wishlist") updateFields.addedToWishlist = { increment: 1 };
    if (event.action === "remove_from_wishlist") updateFields.addedToWishlist = { decrement: 1 };
    if (event.action === "purchase") updateFields.purchases = { increment: 1 };

    // Update or create product analytics
    await prisma.productAnalytics.upsert({
      where: { productId: event.productId },
      update: {
        lastViewedAt: new Date(),
        ...updateFields,
      },
      create: {
        productId: event.productId,
        shopId: event.shopId || null,
        views: event.action === "product_view" ? 1 : 0,
        addedToCart: event.action === "add_to_cart" ? 1 : 0,
        addedToWishlist: event.action === "add_to_wishlist" ? 1 : 0,
        purchases: event.action === "purchase" ? 1 : 0,
        lastViewedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error storing product analytics", error);
  }
}
