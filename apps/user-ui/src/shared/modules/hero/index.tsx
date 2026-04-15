import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-[1px]">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0">
        <img src={"/natural-hero.jpg"} alt="Artisan marketplace products" className="w-full h-full object-cover" width={1920} height={800} />
        {/* Darker overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content - Aligned with main container (max-w-[1280px]) */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 py-24 md:py-36 lg:py-44">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-xl">
          {/* Badge */}
          <span className="inline-block px-4 py-1.5 rounded-full bg-black/50 text-white text-xs font-semibold tracking-wider uppercase mb-6 backdrop-blur-sm border border-white/10">
            500+ Verified Vendors
          </span>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] mb-4">
            Discover Unique
            <br />
            <span className="text-orange-500">Artisan Goods</span>
          </h1>

          {/* Description */}
          <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed">
            Shop directly from independent creators and small businesses. Every purchase supports a real maker.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity">
              Explore Marketplace
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-white/10 text-white font-semibold text-sm backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
              Become a Vendor
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
