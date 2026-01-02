import { prisma } from "@e-com/db";

async function initializeSiteConfig() {
  try {
    const existingConfig = await prisma.siteConfig.findFirst();

    if (!existingConfig) {
      await prisma.siteConfig.create({
        data: {
          categories: ["Electronics", "Fashion", "Home & Kitchen", "Sport & Fitness"],
          subCategories: {
            Electronics: ["Mobile", "Laptops", "Accessories", "Gaming"],
            Fashion: ["Men", "Women", "Kids", "Footwear"],
            "Home & Kitchen": ["Furniture", "Appliances", "Decor"],
            "Sports & Fitness": ["Gym Equipment", "Outdoor Sports", "Wearables"],
          },
        },
      });
    }
  } catch (error) {
    console.error("Error initializing site config", error);
  }
}

export default initializeSiteConfig;
