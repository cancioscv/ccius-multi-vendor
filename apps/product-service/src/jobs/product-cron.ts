import { prisma } from "@e-com/db";
import cron from "node-cron";

cron.schedule("* * * * * ", async () => {
  try {
    const now = new Date();

    // Delete products where `deleteAct` is older than 24 hours
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lte: now },
      },
    });

    console.log(`${deletedProducts.count} expired products permanentely deleted.`);
  } catch (error) {
    console.error(error);
  }
});
