"use client";

import { Shop } from "@e-com/db";

import XIcon from "@/assets/icons/x-icon";
import YoutubeIcon from "@/assets/icons/youtube-icon";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import useLocationTracking from "@/hooks/useLocationTracking";
import useUser from "@/hooks/useUser";
import ProductCard from "@/shared/components/cards/product-card";
import StarRating from "@/shared/components/ratings/star-rating";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Calendar,
  ChevronDown,
  Clock,
  Facebook,
  Globe,
  Heart,
  Home,
  MapPin,
  MessageCircleMore,
  Package,
  ShieldCheck,
  Star,
  ThumbsUp,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@e-com/ui";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = ["Products", "Offers", "Reviews"] as const;
type TabType = (typeof TABS)[number];

const REVIEWS_PER_PAGE = 5;

const REVIEW_SORT_OPTIONS = [
  { value: "most_recent", label: "Most recent" },
  { value: "most_helpful", label: "Most helpful" },
  { value: "highest_rating", label: "Highest rating" },
  { value: "lowest_rating", label: "Lowest rating" },
] as const;
type ReviewSort = (typeof REVIEW_SORT_OPTIONS)[number]["value"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SellerProfile {
  shop: Shop; // TODO: Get Type from generated prisma. Done. Get similar in various parts
  followersCount: number;
}

// ─── Data Fetchers ────────────────────────────────────────────────────────────

async function fetchSellerProducts(id: any) {
  const res = await axiosInstance.get(`/seller/api/seller-products/${id}?page=1&limit=10`);
  return res.data.products;
}

async function fetchSellerOffers(id: string) {
  const res = await axiosInstance.get(`/seller/api/seller-offers/${id}?page=1&limit=10`);
  return res.data.products;
}

async function fetchShopReviews(shopId: string, page: number, sort: ReviewSort) {
  const res = await axiosInstance.get(`/seller/api/shop-reviews/${shopId}?page=${page}&limit=${REVIEWS_PER_PAGE}&sort=${sort}`);
  return res.data;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonProductCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-gray-200 animate-pulse rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 animate-pulse rounded-full w-1/2" />
        <div className="h-4 bg-gray-200 animate-pulse rounded-full w-1/3 mt-3" />
      </div>
    </div>
  );
}

// ─── Review Sort Dropdown ─────────────────────────────────────────────────────

function ReviewSortDropdown({ value, onChange }: { value: ReviewSort; onChange: (v: ReviewSort) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = REVIEW_SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Most recent";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors min-w-[150px] justify-between shadow-sm"
      >
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[175px]">
          {REVIEW_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                opt.value === value ? "bg-orange-50 text-orange-500 font-semibold" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.value === value && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
              {opt.value !== value && <span className="w-1.5 h-1.5 shrink-0" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Write Review Modal ───────────────────────────────────────────────────────

interface WriteReviewModalProps {
  shopName: string;
  shopId: string;
  isVerifiedBuyer: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function WriteReviewModal({ shopName, shopId, isVerifiedBuyer, onClose, onSuccess }: WriteReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lock body scroll while modal is open
    const originalOverflow = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit() {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      // ── Field mapping note ───────────────────────────────────────────────────
      // The ShopReview Prisma model uses `reviews` (String?) for the title/summary
      // and does not have a separate `comment` column yet.
      // We send `reviews` = title and `comment` = body so the backend can store
      // both (add `comment String?` to ShopReview in your schema if not present,
      // or map `comment` → `reviews` in the backend until schema is updated).
      await axiosInstance.post(
        "/seller/api/shop-reviews",
        {
          shopId,
          rating,
          reviews: title, // maps to ShopReview.reviews (title/summary field)
          comment, // maps to ShopReview.comment (add to schema if missing)
          isVerifiedBuyer, // backend stores this flag on the review record
        },
        isProtected
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to submit shop review", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;
  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[95vw] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Rate &amp; Review {shopName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Share your honest experience to help other shoppers.</p>
            {/* ── Option C: show badge when user is a verified buyer ── */}
            {isVerifiedBuyer && (
              <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <BadgeCheck size={12} />
                Verified buyer — your review will show a badge
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0 ml-3"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Star rating selector */}
          <div className="bg-gray-50 rounded-xl p-5 text-center border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Overall Rating</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star size={32} className={`transition-colors ${star <= displayRating ? "fill-orange-400 text-orange-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold text-gray-600 h-5">{displayRating > 0 ? ratingLabels[displayRating] : "Tap a star to rate"}</p>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Review title <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Your review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="What did you like or dislike? How was the shipping, packaging and customer service?"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
            />
            <p className="text-right text-xs text-gray-400 mt-0.5">{comment.length}/1000</p>
          </div>

          {/* Add photos — placeholder (not wired to storage) */}
          <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
            <Upload size={15} />
            Add photos (optional)
          </button>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                rating === 0 || isSubmitting
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

// ─── Reviews Tab Component ────────────────────────────────────────────────────

interface ReviewsTabProps {
  shop: any;
}

function ReviewsTab({ shop }: ReviewsTabProps) {
  const [reviewSort, setReviewSort] = useState<ReviewSort>("most_recent");
  const [reviewPage, setReviewPage] = useState(1);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Option C: check login + whether user has purchased from this shop ────────
  const { user } = useUser();
  const isLoggedIn = !!user;

  // Query whether the current user has at least one completed order from this shop.
  // This drives the "Verified buyer" badge in the modal and on the submitted review.
  const { data: purchaseData } = useQuery({
    queryKey: ["has-purchased-from-shop", shop?.id, user?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/seller/api/has-purchased/${shop?.id}`, isProtected);
      return res.data as { hasPurchased: boolean };
    },
    // Only run when the user is logged in and we have a shop id
    enabled: !!shop?.id && isLoggedIn,
    staleTime: 1000 * 60 * 5,
  });

  const isVerifiedBuyer = purchaseData?.hasPurchased ?? false;

  // Initial load & reload on sort/refresh
  const { data: reviewData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["shop-reviews", shop?.id, reviewSort, refreshKey],
    queryFn: () => fetchShopReviews(shop?.id, 1, reviewSort),
    staleTime: 0,
    enabled: !!shop?.id,
  });

  useEffect(() => {
    if (reviewData) {
      setAllReviews(reviewData.reviews ?? []);
      setTotalReviews(reviewData.total ?? 0);
      setHasMore((reviewData.reviews?.length ?? 0) < (reviewData.total ?? 0));
      setReviewPage(1);
    }
  }, [reviewData]);

  // When sort changes, reset list
  function handleSortChange(sort: ReviewSort) {
    setReviewSort(sort);
    setAllReviews([]);
    setReviewPage(1);
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const nextPage = reviewPage + 1;
      const data = await fetchShopReviews(shop?.id, nextPage, reviewSort);
      const newReviews: any[] = data.reviews ?? [];
      setAllReviews((prev) => [...prev, ...newReviews]);
      setReviewPage(nextPage);
      setHasMore(allReviews.length + newReviews.length < (data.total ?? 0));
    } catch (err) {
      console.error("Failed to load more shop reviews", err);
    } finally {
      setIsLoadingMore(false);
    }
  }

  // ── Rating distribution ───────────────────────────────────────────────────
  const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (reviewData?.ratingDistribution) {
    Object.assign(ratingDistribution, reviewData.ratingDistribution);
  }

  const avgRating = reviewData?.avgRating ?? shop?.ratings ?? 0;

  if (isLoadingReviews) {
    return (
      <div className="p-6 flex items-center justify-center py-16">
        <span className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {showWriteModal && (
        <WriteReviewModal
          shopName={shop?.name}
          shopId={shop?.id}
          isVerifiedBuyer={isVerifiedBuyer}
          onClose={() => setShowWriteModal(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}

      {/* ── Helper: open modal only when logged in ── */}
      {/* Any logged-in user can review; only buyers get the "Verified buyer" badge */}
      {totalReviews === 0 && allReviews.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-base font-medium">No reviews yet</p>
          <p className="text-gray-300 text-sm mt-1">Be the first to review this shop</p>
          {isLoggedIn ? (
            <button
              onClick={() => setShowWriteModal(true)}
              className="mt-4 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Write a Review
            </button>
          ) : (
            <Link
              href="/login"
              className="mt-4 inline-block px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Log in to write a Review
            </Link>
          )}
        </div>
      ) : (
        <div className="flex gap-8">
          {/* ── Left: summary panel ── */}
          <div className="w-[260px] shrink-0 self-start">
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
              {/* Big number */}
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">{Number(avgRating).toFixed(1)}</span>
                <span className="text-sm text-gray-400 mb-2">of 5</span>
              </div>
              <StarRating rating={avgRating} iconClassName="size-5" />
              <p className="text-xs text-gray-400 mt-1 mb-5">Based on {totalReviews} verified reviews</p>

              {/* Bars */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const pct = ratingDistribution[stars] ?? 0;
                  const count = reviewData?.ratingCounts?.[stars] ?? 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-0.5 w-8 shrink-0">
                        <span className="text-gray-500">{stars}</span>
                        <Star size={10} className="fill-orange-400 text-orange-400" />
                      </div>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-gray-400 shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Write a Review — Option C: any logged-in user can review;
                  verified buyers get a badge on their review automatically */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-1">Shared your experience?</p>
                <p className="text-xs text-gray-400 mb-3">Help other shoppers by leaving an honest review.</p>
                {isLoggedIn ? (
                  <button
                    onClick={() => setShowWriteModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    ✏ Write a Review
                  </button>
                ) : (
                  /* Not logged in — redirect to login */
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border border-orange-300 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    Log in to Write a Review
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: review cards ── */}
          <div className="flex-1 min-w-0">
            {/* Top bar: count + sort */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">
                {totalReviews} review{totalReviews !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:inline">Sort by</span>
                <ReviewSortDropdown value={reviewSort} onChange={handleSortChange} />
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {allReviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  {/* Reviewer header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                        style={{
                          background: stringToColor(review.user?.name ?? "U"),
                        }}
                      >
                        {review.user?.name?.[0]?.toUpperCase() ?? "?"}
                        {review.user?.name?.split(" ")?.[1]?.[0]?.toUpperCase() ?? ""}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900">{review.user?.name}</p>
                          {review.isVerifiedBuyer && (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              <BadgeCheck size={10} />
                              Verified buyer
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} iconClassName="size-4" />
                  </div>

                  {/* ── Bug fix: ShopReview Prisma field is called `reviews` (String?)
                      and stores the review title/summary text.
                      The body comment is stored separately as `comment` from the modal.
                      Display title bold + body below, both guarded. ── */}
                  {review.reviews && <h4 className="text-sm font-bold text-gray-900 mb-1">{review.reviews}</h4>}
                  {/* `comment` is the extended review body sent from the modal */}
                  {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                  {/* Fallback: if only one field was filled, show whichever exists */}
                  {!review.reviews && !review.comment && <p className="text-sm text-gray-400 italic">No written review.</p>}

                  {/* Helpful */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors">
                      <ThumbsUp size={13} />
                      Helpful
                      {review.helpfulCount > 0 && ` (${review.helpfulCount})`}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-5">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load more reviews"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Avatar color from name string ───────────────────────────────────────────
function stringToColor(str: string): string {
  const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Main SellerProfile Component ────────────────────────────────────────────

export default function SellerProfile({ shop, followersCount }: SellerProfile) {
  const [activeTab, setActiveTab] = useState<TabType>("Products");
  const [followers, setFollowers] = useState(followersCount);
  const [isFollowing, setIsFollowing] = useState(false);

  const params = useParams();
  const { user } = useUser();
  const { location } = useLocationTracking();
  const { deviceInfo } = useDeviceTracking();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products", params],
    queryFn: () => fetchSellerProducts(params.id),
    staleTime: 0,
  });

  async function getFollowStatus() {
    if (!shop?.id) return;
    try {
      const res = await axiosInstance.get(`/seller/api/is-following/${shop?.id}`);
      setIsFollowing(res.data.isFollowing !== null);
    } catch (error) {
      console.error("Failed to fetch follow status", error);
    }
  }

  useEffect(() => {
    getFollowStatus();
  }, [shop?.id]);

  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ["seller-offers", activeTab],
    queryFn: () => fetchSellerOffers(shop?.id),
    staleTime: 0,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await axiosInstance.post("/seller/api/unfollow-shop", { shopId: shop?.id });
      } else {
        await axiosInstance.post("/seller/api/follow-shop", { shopId: shop?.id });
      }
    },
    onSuccess: () => {
      // Flip state only after successful request
      if (isFollowing) {
        setFollowers(followers - 1);
      } else {
        setFollowers(followers + 1);
      }
      setIsFollowing((prev) => !prev);
      queryClient.invalidateQueries({
        queryKey: ["is-following", shop?.id], // Watch: Apparently this wont update since no useQuery() is used
      });
    },
    onError: () => {
      console.error("Failed to follow/unfollow the shop.");
    },
  });

  // TODO: kafka
  // useEffect(() => {
  //   if (!isLoading) {
  //     if (!location || !deviceInfo || !user?.id) return;
  //     sendKafkaEvent({
  //       userId: user?.id,
  //       shopId: shop?.id,
  //       action: "shop_visit",
  //       country: location?.country || "Unknown",
  //       city: location?.city || "Unknown",
  //       device: deviceInfo || "Unknown Device",
  //     });
  //   }
  // }, [location, deviceInfo, isLoading]);

  // ── Tab counts ──────────────────────────────────────────────────────────────
  const tabCounts: Record<TabType, number | null> = {
    Products: products?.length ?? null,
    Offers: events?.length ?? null,
    Reviews: shop?.reviews?.length ?? null,
  };

  // ── Avatar initials ─────────────────────────────────────────────────────────
  const initials = (shop?.name ?? "S")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="w-full pb-10">
      {/* ── Dynamic Breadcrumbs ── */}
      <div className="mb-4 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition-colors text-sm">
                  <Home size={13} />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-[#a8acb0]" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shops" className="text-gray-500 hover:text-orange-500 transition-colors text-sm">
                  Shops
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-[#a8acb0]" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-orange-500 font-semibold text-sm">{shop?.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* ── Cover Banner ── */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100">
        <Image
          src={shop?.coverBanner || "/placeholder.png"}
          alt={`${shop?.name} cover`}
          className="w-full h-[280px] object-cover"
          width={1200}
          height={300}
        />
        {/* Gradient fade at bottom for softer merge */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
      </div>

      {/* ── Shop Info Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 mt-4">
        <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Avatar */}
          <div
            className="w-[80px] h-[80px] rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-white text-2xl font-bold shadow-sm"
            style={{ background: stringToColor(shop?.name ?? "S") }}
          >
            {shop?.avatar ? <Image src={shop.avatar} alt={shop.name} width={80} height={80} className="w-full h-full object-cover" /> : initials}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            {/* Name + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{shop?.name}</h1>
              {/* Verified badge */}
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-500 border border-orange-200 bg-orange-50 px-2 py-0.5 rounded-full">
                <BadgeCheck size={12} />
                Verified
              </span>
              {/* Category pill */}
              <span className="text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50 px-2.5 py-0.5 rounded-full">
                {shop?.category}
              </span>
            </div>

            {/* Bio */}
            <p className="text-sm text-gray-500 mb-3 max-w-xl">{shop?.bio || "No bio available."}</p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-orange-400 text-orange-400" />
                <span className="font-semibold text-gray-700">{shop?.ratings?.toFixed(1) || "—"}</span>
                <span className="text-gray-400">({shop?.reviews?.length ?? 0} reviews)</span>
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} className="text-gray-400" />
                <span className="font-semibold text-gray-700">{followers.toLocaleString()}</span>
                <span>followers</span>
              </span>
              {shop?.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  {shop.address}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-gray-400" />
                Joined {new Date(shop?.createdAt!).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
              {shop?.openingHours && (
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-gray-400" />
                  {shop.openingHours}
                </span>
              )}
              {shop?.website && (
                <Link
                  href={shop.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-orange-500 hover:underline"
                >
                  <Globe size={14} />
                  Website
                </Link>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleFollowMutation.mutate()}
              disabled={toggleFollowMutation.isPending}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isFollowing ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100" : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              <Heart size={15} fill={isFollowing ? "#ef4444" : "transparent"} stroke={isFollowing ? "#ef4444" : "white"} />
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              <MessageCircleMore size={15} />
              Chat
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
        {[
          { label: "Products", value: products?.length ?? "—" },
          { label: "Positive Ratings", value: "96%" },
          { label: "Ship on Time", value: "98%" },
          { label: "Response Rate", value: "100%" },
        ].map(({ label, value }) => (
          <div key={label} className="py-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Social links ── */}
      {shop?.socialLinks && (shop.socialLinks as any[]).length > 0 && (
        <div className="flex items-center gap-3 mt-4 px-1">
          {(shop.socialLinks as any[]).map((link: any, index: number) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
            >
              {link.type === "youtube" && <YoutubeIcon />}
              {link.type === "x" && <XIcon />}
              {link.type === "facebook" && <Facebook className="text-blue-600" size={16} />}
            </a>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => {
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-3.5 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === tab ? "text-orange-500" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
                {count != null && count > 0 && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-t" />}
              </button>
            );
          })}
        </div>

        {/* ── Products tab ── */}
        {activeTab === "Products" && (
          <div className="p-5">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <SkeletonProductCard key={index} />
                ))}
              </div>
            ) : (products?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                {products?.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-gray-400">No products available yet!</p>
            )}
          </div>
        )}

        {/* ── Offers tab ── */}
        {activeTab === "Offers" && (
          <div className="p-5">
            {isEventsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <SkeletonProductCard key={index} />
                ))}
              </div>
            ) : (events?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                {events?.map((product: any) => (
                  <ProductCard isEvent={true} key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-gray-400">No offers available yet!</p>
            )}
          </div>
        )}

        {/* ── Reviews tab ── */}
        {activeTab === "Reviews" && <ReviewsTab shop={shop} />}
      </div>

      {/* ── Trust strip ── */}
      <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {[
          {
            icon: <Truck size={20} className="text-orange-400" />,
            title: "Fast Shipping",
            sub: "Ships within 24 hours",
          },
          {
            icon: <ShieldCheck size={20} className="text-orange-400" />,
            title: "Verified Seller",
            sub: "Authentic guarantee",
          },
          {
            icon: <Package size={20} className="text-orange-400" />,
            title: "Worldwide Delivery",
            sub: "Ships to 60+ countries",
          },
        ].map(({ icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3 py-3 sm:py-0 sm:px-6 first:pl-0 last:pr-0">
            <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">{icon}</div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
