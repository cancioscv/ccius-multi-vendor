import { prisma } from "@e-com/db";
import cron from "node-cron";

cron.schedule("* * * * * ", async () => {
  try {
    const now = new Date();

    // Find all sellers marked as isDeleted and past the deletedAt datee
    const deletedSellers = await prisma.seller.findMany({
      where: {
        isDeleted: true,
        deletedAt: { lte: now },
      },
      include: { shop: true },
    });

    for (const seller of deletedSellers) {
      // Delete shop if exists
      if (seller.shop) {
        await prisma.shop.delete({
          where: {
            id: seller.shop.id,
          },
        });
      }

      // Delete seller
      await prisma.seller.delete({
        where: {
          id: seller.id,
        },
      });
    }
  } catch (error) {
    console.error("Error deleting expired sellers and their shops", error);
  }
});
