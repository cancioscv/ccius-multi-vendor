"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Star, ImagePlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";

export default function WriteReviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  // ✅ orderId passed as ?orderId=... so we can invalidate the order cache on success
  const orderId = searchParams.get("orderId");

  const router = useRouter();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      comment: "",
    },
  });

  const titleValue = watch("title") || "";
  const commentValue = watch("comment") || "";

  // Fetch product info
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/product/api/product/id/${productId}`);
      return res.data.product;
    },
    enabled: !!productId,
  });

  // Fetch existing review for this product (edit flow)
  const { data: existingReview } = useQuery({
    queryKey: ["user-review", productId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/product/api/review/${productId}`);
      return res.data.review;
    },
    enabled: !!productId,
  });

  // ✅ Pre-fill form when existing review is loaded
  useEffect(() => {
    if (existingReview) {
      reset({
        title: existingReview.title ?? "",
        comment: existingReview.comment ?? "",
      });
      setRating(existingReview.rating ?? 0);
    }
  }, [existingReview, reset]);

  const { mutate: submitReview } = useMutation({
    mutationFn: async (data: { rating: number; title: string; comment: string; anonymous: boolean }) => {
      if (existingReview) {
        // ✅ Pass reviewId in the URL param — backend reads it from req.params
        const res = await axiosInstance.put(`/product/api/update-review/${existingReview.id}`, data);
        return res.data;
      } else {
        const res = await axiosInstance.post(`/product/api/create-review`, {
          ...data,
          productId,
        });
        return res.data;
      }
    },
    onSuccess: () => {
      // Invalidate the review query so edit flow detects the new review next time
      queryClient.invalidateQueries({ queryKey: ["user-review", productId] });

      // ✅ Invalidate the specific order so ReviewButton re-renders as "Edit Review"
      // when the user lands back on the order detail page
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      }

      router.push(orderId ? `/order/${orderId}` : "/profile?active=My+Orders");
    },
  });

  const onSubmit = (data: any) => {
    if (rating === 0) return;
    submitReview({
      rating,
      title: data.title,
      comment: data.comment,
      anonymous: isAnonymous,
    });
  };

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewImages((prev) => [...prev, ...urls].slice(0, 5));
  }

  const isEditing = !!existingReview;

  return (
    <div className="min-h-screen bg-[#f5f5f0] px-4 py-8">
      <div className="max-w-xl mx-auto">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{isEditing ? "Edit Review" : "Write Review"}</h1>
          <p className="text-sm text-gray-400 mb-6">
            {isEditing ? "Update your review to reflect your latest experience." : "Share your experience to help other shoppers."}
          </p>

          {/* Product preview */}
          {!isLoadingProduct && product && (
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 mb-7 border border-gray-100">
              <Image
                src={product.images?.[0]?.url || "/placeholder.png"}
                alt={product.title}
                width={56}
                height={56}
                className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{product.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{product.shop?.name}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Your rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition ${
                        star <= (hoveredRating || rating) ? "fill-[#e07b39] text-[#e07b39]" : "fill-gray-100 text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating === 0 && <p className="text-xs text-gray-400 mt-1">Click a star to rate</p>}
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Review title</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Sum up your experience in a few words"
                  maxLength={80}
                  {...register("title", { required: true })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e07b39] transition pr-16"
                />
                <span className="absolute right-3 bottom-3 text-xs text-gray-300">{titleValue.length}/80</span>
              </div>
            </div>

            {/* Review Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Your review</label>
              <div className="relative">
                <textarea
                  rows={5}
                  placeholder="What did you like or dislike? How did it perform?"
                  maxLength={1000}
                  {...register("comment", { required: true })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#e07b39] transition resize-none"
                />
                <span className="absolute right-3 bottom-3 text-xs text-gray-300">{commentValue.length}/1000</span>
              </div>
            </div>

            {/* Add Photos */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Add photos <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                {previewImages.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                    <Image src={src} alt={`preview-${i}`} fill className="object-cover" />
                  </div>
                ))}
                {previewImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-[#e07b39] hover:text-[#e07b39] transition"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              </div>
            </div>

            {/* Anonymous toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setIsAnonymous((v) => !v)}
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                  isAnonymous ? "border-[#e07b39] bg-[#e07b39]" : "border-gray-300"
                }`}
              >
                {isAnonymous && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-sm text-gray-600">Post this review anonymously</span>
            </label>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="bg-[#e07b39] text-white text-sm px-6 py-2.5 rounded-xl hover:bg-[#c96a2a] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : isEditing ? "Update review" : "Submit review"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-gray-500 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
