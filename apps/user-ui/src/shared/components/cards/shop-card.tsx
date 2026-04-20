import { Button } from "@e-com/ui";
import { ExternalLink, MapPin, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    avatar: string;
    coverBanner?: string;
    address?: string;
    followers?: [];
    ratings?: number;
    category?: string;
  };
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <div className="w-full rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Cover */}
      <div className="h-[120px] w-full relative">
        <Image
          src={shop?.coverBanner || "/placeholder.png"}
          alt="Cover"
          fill
          className="object-cover w-full h-full hover:scale-105 transition-all duration-300"
        />
      </div>

      {/* Avatar */}
      <div className="relative flex justify-center -mt-8">
        <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow bg-white">
          <Image src={shop?.avatar || "/placeholder.png"} alt={shop.name} width={64} height={64} className="object-cover" />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-2 text-center">
        <h3 className="text-base font-semibold font-heading text-gray-800 group-hover:text-orange-500 transition-colors duration-300">
          {shop?.name}
        </h3>

        <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground text-gray-500">
          <Users className="h-3 w-3" />
          <span>{shop?.followers?.length ?? 0} Followers</span>
        </div>

        {/* Address + Rating */}
        <div className="flex items-center justify-center text-xs text-gray-500 mt-3 gap-4 flex-wrap">
          {shop.address && (
            <span className="flex items-center gap-1 max-w-[120px]">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{shop.address}</span>
            </span>
          )}

          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            {shop.ratings ?? "N/A"}
          </span>
        </div>

        {/* Category */}
        {shop?.category && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="bg-[#F3F0ED] capitalize text-[#251D18] px-2 py-0.5 rounded-full font-medium">{shop.category}</span>
          </div>
        )}

        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-4 w-full text-sm gap-1.5 hover:bg-orange-500 hover:text-white transition-colors p-4 border border-[#E9E6E2] bg-[#F9F7F5] roundeds-xl"
        >
          <Link href={`/shop/${shop.id}`}>
            Visit Store <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
