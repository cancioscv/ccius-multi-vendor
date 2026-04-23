import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart, MapPin, MessageCircleMore, Minus, Plus, ShoppingCart, X, BadgeCheck, Package, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store";
import useUser from "@/hooks/useUser";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";
import StarRating from "../ratings/star-rating";

interface Props {
  product: any;
  setOpen: (open: boolean) => void;
}

export default function ProductDetailsCard({ product, setOpen }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [isColorSelected, setIsColorSelected] = useState(product?.colors?.[0] || "");
  const [isSizeSelected, setIsSizeSelected] = useState(product?.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  // ── Track whether we're mounted on the client (required for createPortal) ──
  const [mounted, setMounted] = useState(false);

  const { cart, wishList, addToCart, removeFromCart, addToWishlist, removeFromWishlist } = useCartStore();
  const isInCart = cart.some((item) => item.id === product.id);
  const isWishlisted = wishList.some((item) => item.id === product.id);

  const { user } = useUser();
  const { location } = useLocationTracking();
  const { deviceInfo } = useDeviceTracking();

  const router = useRouter();

  const estimatedDelivery = new Date(); // This depends on DHL or so.
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const hasDiscount = product?.regularPrice > product?.salePrice;
  const discountPercent = hasDiscount ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100) : 0;

  const reviewRating = product?.reviewRating ?? 0;
  const reviewCount = product?.reviewCount ?? 0;

  // ── Mount flag for portal ──────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Lock body scroll while modal is open ──────────────────────────────────
  // This prevents the background page from scrolling and also blocks
  // interaction with the header / nav that sit outside the modal's z-stack.
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for the scrollbar width so the layout doesn't jump
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      // Restore on unmount
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // ── Close on Escape key ───────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  async function handleChat() {
    if (isLoading) {
      return;
    }
    setIsLoading(true);

    try {
      const res = await axiosInstance.post("/chat/api/create-user-conversation-group", { sellerId: product?.shop?.sellerId }, isProtected);
      router.push(`/inbox?conversationId=${res.data.conversation.id}`);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddToCart() {
    addToCart(
      {
        ...product,
        quantity,
        selectedOptions: { color: isColorSelected, size: isSizeSelected },
      },
      user,
      location,
      deviceInfo
    );
  }

  function handleAddToWishList() {
    if (isWishlisted) {
      removeFromWishlist(product.id, user, location, deviceInfo);
    } else {
      addToWishlist(
        {
          ...product,
          quantity,
          selectedOptions: { color: isColorSelected, size: isSizeSelected },
        },
        user,
        location,
        deviceInfo
      );
    }
  }

  // ── Modal JSX ─────────────────────────────────────────────────────────────
  const modal = (
    /*
     * ── Backdrop ─────────────────────────────────────────────────────────────
     * z-[9999] ensures it renders ABOVE the fixed header (z-[100]) and the
     * mega-menu panel (z-[89]), covering the entire viewport including the
     * Hero section. Using createPortal mounts this directly on <body> so it
     * is never clipped by any ancestor's stacking context (e.g. Hero's
     * relative/transform wrapper).
     */
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.60)",
      }}
      // ── Click outside the card to close ──
      onClick={() => setOpen(false)}
      // Prevent wheel/touch scroll from propagating to the page behind
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
    >
      {/* ── Modal card ─────────────────────────────────────────────────────── */}
      <div
        className="relative flex w-[900px] max-w-[95vw] h-[540px] max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
        // Stop clicks inside the card from bubbling up to the backdrop
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT: Full-bleed product image ─────────────────────────────── */}
        <div className="relative w-[45%] shrink-0 h-full bg-gray-100">
          {/* Limited Stock badge */}
          {product?.stock <= 5 && (
            <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-500 text-white">
              Limited Stock
            </span>
          )}
          {/* Discount badge */}
          {hasDiscount && (
            <span className="absolute top-3 right-3 z-10 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-600 text-white">
              -{discountPercent}%
            </span>
          )}
          <Image src={product?.images?.[activeImage]?.url || "/placeholder.png"} alt={product?.title} fill className="object-cover" />
          {/* Thumbnail dot strip (if multiple images) */}
          {product?.images?.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-3">
              {product.images.slice(0, 5).map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${activeImage === i ? "bg-white scale-125" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Product details ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto pl-6 pr-12 py-5">
          {/* ── Top: Shop info + Chat button ── */}
          <div className="flex items-center justify-between mb-4 border-b relative pb-3 border-gray-200">
            <div className="flex items-center gap-2.5">
              {/* Shop avatar */}
              <div className="w-9 h-9 rounded-full bg-orange-100 overflow-hidden shrink-0 flex items-center justify-center">
                {product?.shop?.avatar ? (
                  <Image
                    src={product.shop.avatar}
                    alt={product.shop.name}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-sm font-bold text-orange-600">{product?.shop?.name?.[0]?.toUpperCase() ?? "S"}</span>
                )}
              </div>
              <div>
                <Link
                  href={`/shop/${product?.shop?.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-orange-500 transition-colors leading-none"
                >
                  {product?.shop?.name}
                </Link>
                <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                  <BadgeCheck size={12} className="text-blue-500" />
                  Verified Seller
                </p>
              </div>
            </div>

            {/* Chat button */}
            <button
              onClick={handleChat}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-[#E3F2FD] text-[#1976D2]  hover:border-gray-300 hover:bg-[#1565C0] hover:text-white transition-colors disabled:opacity-50"
            >
              <MessageCircleMore size={14} />
              Chat with Vendor
            </button>
          </div>

          {/* ── Product title ── */}
          <h2 className="text-xl font-bold text-gray-900 leading-snug mb-2">{product?.title}</h2>

          {/* ── Stars + review count + sold ── */}
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={reviewRating} iconClassName="size-4" />
            {reviewRating > 0 && <span className="text-sm font-semibold text-gray-700">{reviewRating.toFixed(1)}</span>}
            {reviewCount > 0 && <span className="text-sm text-gray-400">({reviewCount} reviews)</span>}
            {product?.totalSales > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-400">{product.totalSales} sold</span>
              </>
            )}
          </div>

          {/* ── Price ── */}
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl font-bold text-gray-900">${product?.salePrice?.toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className="text-base text-gray-400 line-through">${product?.regularPrice?.toFixed(2)}</span>
                <span className="text-sm font-semibold text-green-600">Save {discountPercent}%</span>
              </>
            )}
          </div>

          {/* ── Description ── */}
          <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3 w-96 truncate">{product?.description}</p>

          {/* ── Brand ── */}
          {product?.brand && (
            <p className="text-sm text-gray-600 mb-3">
              <strong>Brand:</strong> {product.brand}
            </p>
          )}

          {/* ── Color & Size ── */}
          <div className="flex flex-col gap-3 mb-4">
            {product?.colors?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</p>
                <div className="flex gap-2">
                  {product.colors.map((color: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setIsColorSelected(color)}
                      title={color}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        isColorSelected === color ? "border-orange-500 scale-110 shadow" : "border-gray-200 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product?.sizes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Size</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setIsSizeSelected(size)}
                      className={`px-3 py-1 text-xs font-semibold rounded border transition-all ${
                        isSizeSelected === size
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Quantity + Add to Cart + Wishlist ── */}
          <div className="flex items-center gap-3 mb-4">
            {/* Quantity stepper */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-gray-800 select-none">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Add to Cart */}
            <button
              disabled={isInCart || product?.stock === 0}
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                isInCart || product?.stock === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
              }`}
            >
              <ShoppingCart size={16} />
              {isInCart ? "In Cart" : "Add to Cart"}
            </button>

            {/* Wishlist */}
            <button
              onClick={handleAddToWishList}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:border-red-300 transition-colors"
            >
              <Heart size={18} fill={isWishlisted ? "#ef4444" : "transparent"} stroke={isWishlisted ? "#ef4444" : "#9ca3af"} />
            </button>
          </div>

          {/* ── Shipping perks strip ── */}
          <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-xl text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Package size={14} className="text-orange-500" />
              Free shipping over $50
            </span>
            <span className="w-px h-3 bg-gray-200" />
            <span className="flex items-center gap-1.5">
              <RotateCcw size={14} className="text-orange-500" />
              30-day easy returns
            </span>
          </div>

          {/* ── Stock + Delivery ── */}
          <div className="mt-3 flex flex-col gap-1">
            {product.stock > 0 ? (
              <span className="text-xs font-semibold text-green-600">● In Stock</span>
            ) : (
              <span className="text-xs font-semibold text-red-500">● Out of Stock</span>
            )}
            {product?.stock > 0 && (
              <p className="text-xs text-gray-400">
                Estimated Delivery: <strong className="text-gray-600">{estimatedDelivery.toDateString()}</strong>
              </p>
            )}
          </div>
        </div>

        {/* ── X close button — top-right corner of the card ── */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-gray-100 border border-gray-200 shadow-sm transition-colors z-20"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );

  /*
   * ── createPortal ────────────────────────────────────────────────────────────
   * Mount the backdrop directly on <body> so it is never a descendant of
   * Hero's transform/relative wrapper or the header's stacking context.
   * This guarantees z-[9999] works as expected across every page.
   */
  if (!mounted) return null;
  return createPortal(modal, document.body);
}
