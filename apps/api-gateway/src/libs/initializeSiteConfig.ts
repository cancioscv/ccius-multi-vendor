import { prisma } from "@e-com/db";

async function initializeSiteConfig() {
  try {
    const existingConfig = await prisma.siteConfig.findFirst();

    if (!existingConfig) {
      await prisma.siteConfig.create({
        data: {
          categories: ["Electronics", "Fashion", "Home & Kitchen", "Sports & Fitness"],
          subCategories: {
            Electronics: ["Mobile", "Laptops", "Accessories", "Gaming"],
            Fashion: ["Men", "Women", "Kids", "Footwear"],
            "Home & Kitchen": ["Furniture", "Appliances", "Decor"],
            "Sports & Fitness": ["Gym Equipment", "Outdoor Sports", "Wearables"],
          },
          logo: "/e-shop-logo.jpg",
          banner: "https://ik.imagekit.io/fz0xzwtey/products/slider-img-1.png?updatedAt=1744358118885",
        },
      });
    }
  } catch (error) {
    console.error("Error initializing site config", error);
  }
}

export default initializeSiteConfig;
