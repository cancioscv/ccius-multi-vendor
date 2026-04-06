import { prisma } from "@e-com/db";

async function initializeSiteConfig() {
  try {
    const existingConfig = await prisma.siteConfig.findFirst();

    if (!existingConfig) {
      await prisma.siteConfig.create({
        data: {
          categories: ["Electronics", "Fashion & Apparel", "Home & Kitchen", "Sports & Fitness"],
          subCategories: {
            Electronics: {
              "Computers & Laptops": ["Laptops", "Desktops", "Monitors", "PC Components", "Networking Devices"],
              "Mobile Phones": ["Smartphones", "Refurbished Phones", "Phone Cases & Covers", "Power Banks", "Cables & Chargers"],
              "Audio & Video": ["Headphones & Earbuds", "Bluetooth Speakers", "Smart TVs", "Home Theater Systems", "Projectors"],
              "Cameras & Photo": ["Digital SLR Cameras", "Mirrorless Cameras", "Camera Lenses", "Drones & Action Cameras", "Tripods & Lighting"],
              "Wearable Tech": ["Smartwatches", "Fitness Trackers", "VR Headsets", "Smart Glasses", "Wearable Accessories"],
              "Video Games & Consoles": ["PlayStation Consoles", "Xbox Consoles", "Nintendo Switch", "Video Games", "Gaming Accessories"],
            },
            "Fashion & Apparel": {
              "Men's Clothing": ["T-Shirts", "Jeans", "Suits", "Activewear"],
              "Women's Clothing": ["Dresses", "Tops", "Skirts", "Activewear"],
              Footwear: ["Sneakers", "Boots", "Sandals", "Formal Shoes"],
              Accessories: ["Bags", "Belts", "Sunglasses", "Hats"],
            },
            "Home & Kitchen": {
              Furniture: ["Living Room", "Bedroom", "Kitchen & Dining", "Office", "Outdoor"],
              Appliances: [
                "Refrigerators",
                "Ovens",
                "Dishwashers",
                "Washers/Dryers",
                "Coffee makers",
                "Blenders",
                "Toasters",
                "Air fryers",
                "Vacuums",
                "Thermostats",
                "Security cameras",
                "Smart speakers",
                "Lighting systems",
              ],
              Decor: ["Lighting", "Textiles", "Wall Art", "Storage"],
            },
            "Sports & Fitness": {
              "Gym Equipment": ["Strength Training", "Cardio Machines", "Free Weights", "Accessories"],
              "Outdoor Sports": ["Cycling", "Water Sports", "Racquet Sports", "Winter Sports", "Camping & Hiking"],
              Wearables: ["Fitness Trackers", "Smart Watches", "Heart Rate Monitors", "GPS Watches"],
            },
          },
          logo: "/e-shop-logo.jpg",
        },
      });
    }
  } catch (error) {
    console.error("Error initializing site config", error);
  }
}

export default initializeSiteConfig;
