"use client";

// import useLayout from "@/hooks/useLayout";
// import { MoveRight } from "lucide-react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";

// export default function Hero() {
//   const router = useRouter();
//   const { layout } = useLayout();
//   return (
//     <div className="bg-[#115061] h-[85vh] flex flex-col justify-center w-full">
//       <div className="md:w-[80%] w-[90%] m-auto md:flex h-full items-center">
//         <div className="md:w-1/2">
//           <p className="font-Roboto font-normal text-white pb-2 text-xl">Starting from 40$</p>
//           <h1 className="text-white text-6xl font-extrabold font-Roboto">
//             The best watch <br />
//             Collection 2025
//           </h1>
//           <p className="font-Oregano text-3xl pt-4 text-white">
//             Exclusive offer <span className="text-yellow-400">10%</span> off this week
//           </p>
//           <br />
//           <button
//             className="w-[140px] gap-2 font-extrabold h-[40px] flex items-center justify-center rounded-md bg-gray-300 hover:bg-[#115061] hover:text-white hover:border-white hover:border"
//             onClick={() => router.push("/products")}
//           >
//             Show now <MoveRight />
//           </button>
//         </div>

//         <div className="md:w-1/2 flex justify-center">
//           <Image src={layout?.banner || "/placeholder.png"} alt="" width={450} height={450} />
//         </div>
//       </div>
//     </div>
//   );
// }

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={"/hero.jpg"} alt="Artisan marketplace products" className="w-full h-full object-cover" width={1920} height={800} />
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
