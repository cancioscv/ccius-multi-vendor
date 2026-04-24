import { prisma } from "@e-com/db";

async function initializeSiteConfig() {
  try {
    const existingConfig = await prisma.siteConfig.findFirst();

    if (!existingConfig) {
      await prisma.siteConfig.create({
        data: {
          categories: [
            "Electronics",
            "Fashion & Apparel",
            "Food & Grocery",
            "Home & Living",
            "Beauty",
            "Health",
            "Sports & Outdoors",
            "Kids & Toys",
            "Automotive",
            "Hobbies & Music",
            "Books & Office",
            "Tools",
            "Pets",
            "Jewelry",
            "Gifts",
            "Digital",
          ],
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
              "Men's Clothing": ["T-Shirts", "Shirts", "Jeans", "Suits", "Jackets", "Activewear"],
              "Women's Clothing": ["Dresses", "Tops", "Skirts", "Jeans", "Activewear", "Outerwear"],
              Footwear: ["Sneakers", "Boots", "Sandals", "Heels", "Formal Shoes"],
              Accessories: ["Bags", "Belts", "Sunglasses", "Hats", "Wallets", "Watches"],
            },
            "Food & Grocery": {
              Groceries: ["Fruits & Vegetables", "Meat & Seafood", "Dairy & Eggs", "Pantry Staples", "Snacks"],
              Beverages: ["Soft Drinks", "Juices", "Coffee", "Tea", "Alcoholic Beverages"],
              "Prepared Food": ["Fast Food", "Healthy Meals", "Desserts", "Street Food"],
              Restaurants: ["Casual Dining", "Fine Dining", "Cafes", "Takeaway", "Delivery"],
              Bakery: ["Bread", "Cakes", "Pastries", "Cookies"],
            },
            "Home & Living": {
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
              ],
              Decor: ["Lighting", "Textiles", "Wall Art", "Storage"],
            },
            Beauty: {
              Skincare: ["Moisturizers", "Cleansers", "Serums", "Sunscreen"],
              Haircare: ["Shampoo", "Conditioner", "Hair Treatments", "Styling Products"],
              Makeup: ["Foundation", "Lipstick", "Mascara", "Eyeshadow"],
              Fragrance: ["Perfumes", "Body Sprays"],
              Grooming: ["Shavers", "Trimmers", "Personal Hygiene"],
            },
            Health: {
              Medicines: ["OTC Medicines", "Prescription Drugs", "Supplements", "Vitamins"],
              "Medical Equipment": ["Thermometers", "Blood Pressure Monitors", "Glucose Meters"],
              "Personal Care": ["First Aid", "Face Masks", "Sanitizers"],
              Wellness: ["Herbal Products", "Mental Health", "Sexual Wellness"],
            },
            "Sports & Outdoors": {
              "Gym Equipment": ["Strength Training", "Cardio Machines", "Free Weights", "Accessories"],
              "Outdoor Sports": ["Cycling", "Water Sports", "Racquet Sports", "Winter Sports", "Camping & Hiking"],
              Apparel: ["Sportswear", "Shoes", "Accessories"],
              Wearables: ["Fitness Trackers", "Smart Watches", "Heart Rate Monitors", "GPS Watches"],
            },
            "Kids & Toys": {
              Toys: ["Educational Toys", "Action Figures", "Puzzles", "Board Games"],
              Baby: ["Diapers", "Baby Food", "Strollers", "Car Seats"],
              Kids: ["Clothing", "School Supplies", "Accessories"],
            },
            Automotive: {
              Parts: ["Engine Parts", "Brakes", "Suspension", "Filters"],
              Accessories: ["Seat Covers", "Car Electronics", "Car Care", "Tools"],
              Motorcycles: ["Parts", "Helmets", "Riding Gear"],
            },
            "Hobbies & Music": {
              Art: ["Paints", "Brushes", "Canvas", "Drawing Tools"],
              Crafts: ["DIY Kits", "Sewing", "Knitting", "Scrapbooking"],
              Music: ["Guitars", "Keyboards", "Drums", "Accessories"],
            },
            "Books & Office": {
              Books: ["Fiction", "Non-fiction", "Educational", "Comics"],
              Office: ["Printers", "Office Furniture", "Supplies"],
              Stationery: ["Notebooks", "Pens", "Folders", "Art Supplies"],
            },
            Tools: {
              Tools: ["Hand Tools", "Power Tools", "Tool Sets"],
              Electrical: ["Wires", "Switches", "Lighting"],
              Plumbing: ["Pipes", "Fittings", "Fixtures"],
              Safety: ["Protective Gear", "Security Equipment"],
            },
            Pets: {
              Food: ["Dog Food", "Cat Food", "Bird Food"],
              Accessories: ["Leashes", "Toys", "Beds"],
              Health: ["Vet Supplies", "Grooming", "Supplements"],
              Services: ["Grooming", "Training", "Pet Sitting"],
            },
            Jewelry: {
              Jewelry: ["Necklaces", "Rings", "Bracelets", "Earrings"],
              Watches: ["Smartwatches", "Luxury Watches", "Casual Watches"],
            },
            Gifts: {
              Gifts: ["Personalized Gifts", "Gift Baskets", "Cards"],
              Occasions: ["Birthday", "Wedding", "Anniversary", "Corporate"],
              Souvenirs: ["Local Crafts", "Memorabilia"],
            },
            Digital: {
              Software: ["Productivity", "Antivirus", "Design Tools"],
              Subscriptions: ["Streaming", "Music", "Cloud Services"],
              Courses: ["Online Courses", "Certifications"],
              "Digital Assets": ["E-books", "Templates", "Stock Media"],
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
