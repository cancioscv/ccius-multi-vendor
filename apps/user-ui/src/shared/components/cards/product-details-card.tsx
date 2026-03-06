import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, MapPin, MessageCircleMore, Minus, Plus, ShoppingCart, X } from "lucide-react";
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

  const { cart, wishList, addToCart, removeFromCart, addToWishlist, removeFromWishlist } = useCartStore();
  const isInCart = cart.some((item) => item.id === product.id);
  const isWishlisted = wishList.some((item) => item.id === product.id);

  const { user } = useUser();
  const { location } = useLocationTracking();
  const { deviceInfo } = useDeviceTracking();

  const router = useRouter();

  const estimatedDelivery = new Date(); // This depends on DHL or so.
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

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

  return (
    <div className="fixed flex items-center justify-center top-0 left-0 h-screen w-full bg-[#0000001d] z-50">
      <div
        className="w-[90%] md:w-[70%] md:mt-14 2xl:mt-0 h-max overflow-scroll max-h-[80vh] p-4 md:p-6 bg-white shadow-md rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-full">
            <Image
              src={product?.images?.[activeImage]?.url || "/placeholder.png"}
              alt={product?.images[activeImage]?.url || ""}
              width={400}
              height={400}
              className="w-full max-h-[60vh] rounded-lg object-contain"
            />
            {/* Thumbnails */}
            <div className="flex gap-2 mt-4">
              {product?.images?.map((img: any, index: number) => (
                <div
                  key={index}
                  className={`cursor-pointer border rounded-md ${activeImage === index ? "border-gray-500 p-0.5" : "border-transparent"}`}
                  onClick={() => setActiveImage(index)}
                >
                  <Image src={img?.url || "/placeholder.png"} alt={img?.url} className="rounded-md" width={80} height={80} />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-1/2 md:pl-8 mt-6 md:mt-0">
            {/* Seller Info */}
            <div className="border-b relative pb-3 border-gray-200 flex items-center justify-between">
              <div className="flex items-start gap-3 mt-6">
                {/* Shop Logo */}
                <Image
                  src={product?.shop?.avatar || "/placeholder.png"}
                  alt="Shop Logo"
                  width={60}
                  height={60}
                  className="rounded-full w-[60px] h-[60px] object-cover"
                />

                <div>
                  <Link href={`/shop/${product?.shop?.id}`} className="text-lg font-medium">
                    {product?.shop?.name}
                  </Link>

                  {/* Shop Ratings */}
                  <span className="block mt-1">
                    <StarRating rating={product?.reviewRating} iconClassName="size-4" />
                  </span>

                  {/* Shop Location */}
                  <p className="text-gray-600 mt-1 flex items-center gap-1 text-sm">
                    <MapPin size={20} /> {product?.shop?.address || "Location Not Available"}
                  </p>
                </div>
              </div>

              {/* Chat with Seller Button */}
              <button
                className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md"
                onClick={() => handleChat()}
              >
                <MessageCircleMore size={18} /> Chat with Seller
              </button>

              <button className="w-full absolute cursor-pointer right-[-5px] top-[-5px] flex justify-end my-2 mt-[-10px]">
                <X size={25} onClick={() => setOpen(false)} />
              </button>
            </div>
            <h3 className="text-xl font-semibold mt-3">{product?.title}</h3>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap w-full">{product?.description} </p>
            {/* Brand */}
            {product?.brand && (
              <p className="mt-2">
                <strong>Brand:</strong> {product.brand}
              </p>
            )}
            {/* Color & Size Selection */}
            <div className="flex flex-col md:flex-row items-start gap-5 mt-4">
              {/* Color Options */}
              {product?.colors?.length > 0 && (
                <div>
                  <strong>Color:</strong>
                  <div className="flex gap-2 mt-1">
                    {product.colors.map((color: string, index: number) => (
                      <button
                        key={index}
                        className={`w-8 h-8 cursor-pointer rounded-full border-2 transition ${
                          isColorSelected === color ? "border-gray-400 scale-110 shadow-md" : "border-transparent"
                        }`}
                        onClick={() => setIsColorSelected(color)}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Size Options */}
              {product?.sizes?.length > 0 && (
                <div>
                  <strong>Size:</strong>
                  <div className="flex gap-2 mt-1">
                    {product.sizes.map((size: string, index: number) => (
                      <button
                        key={index}
                        className={`px-3 py-1 cursor-pointer rounded-md transition ${
                          isSizeSelected === size ? "bg-gray-800 text-white" : "bg-gray-300 text-black"
                        }`}
                        onClick={() => setIsSizeSelected(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Price Section */}
            <div className="mt-5 flex items-center gap-4">
              <h3 className="text-2xl font-semibold text-gray-900">${product?.salePrice}</h3>
              {product?.regularPrice && <h3 className="text-lg text-red-600 line-through">${product.regularPrice}</h3>}
            </div>
            {/* Actions: Quantity/Add to Cart */}
            <div className="mt-5 flex items-center gap-5">
              <div className="flex items-center rounded-md">
                <button
                  className="px-3 cursor-pointer py-1 bg-gray-300 hover:bg-gray-400 text-black font-bold rounded-l-md"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  <Minus />
                </button>
                <span className="px-4 bg-gray-100 py-1">{quantity}</span>
                <button
                  className="px-3 py-1 cursor-pointer bg-gray-300 hover:bg-gray-400 text-black font-bold rounded-r-md"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  <Plus />
                </button>
              </div>

              <button
                disabled={isInCart}
                onClick={handleAddToCart}
                className={`flex items-center gap-2 px-4 py-2 bg-[#ff5722] hover:bg-[#e64a19] text-white font-medium rounded-lg transition ${
                  isInCart ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>

              <button className="opacity-[.7] cursor-pointer" onClick={handleAddToWishList}>
                <Heart size={30} fill={isWishlisted ? "red" : "transparent"} color={isWishlisted ? "transparent" : "black"} />
              </button>
            </div>
            {/* Stock */}
            <div className="mt-3">
              {product.stock > 0 ? (
                <span className="text-green-600 font-semibold">In Stock</span>
              ) : (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              )}
            </div>
            <div className="mt-3 text-gray-600 text-sm">
              Estimated Delivery: <strong>{estimatedDelivery.toDateString()}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
