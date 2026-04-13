import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2">
      <div className="absolute inset-0">
        <img src={"/natural-hero.jpg"} alt="Artisan marketplace products" className="w-full h-full object-cover" width={1920} height={800} />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
      </div>

      <div className="container relative z-10 py-24 md:py-36 lg:py-44">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-xs font-semibold tracking-wider uppercase mb-4 backdrop-blur-sm">
            500+ Verified Vendors
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground leading-[1.1] mb-4">
            Discover Unique
            <br />
            <span className="text-gradient-primary">Artisan Goods</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-md leading-relaxed">
            Shop directly from independent creators and small businesses. Every purchase supports a real maker.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              Explore Marketplace
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-primary-foreground/10 text-primary-foreground font-semibold text-sm backdrop-blur-sm border border-primary-foreground/20 hover:bg-primary-foreground/20 transition-colors">
              Become a Vendor
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
