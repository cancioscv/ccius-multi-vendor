"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import { Button, Textarea } from "@e-com/ui";
import StarPicker from "@/shared/components/ratings/star-picker";
import ReviewForm from "@/shared/components/ratings/review-form";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export default function ProductReview() {
  const params = useParams();

  const productId = params.productId as string;

  return (
    <div className="min-h-screen bg-white">
      <nav className="p-4 bg-[#F4F4F0] w-full border-b">
        <Link prefetch href="/profile?active=My+Orders" className="flex items-center gap-2">
          <ArrowLeftIcon className="size-4" />
          <span className="text font-medium">Back to Orders</span>
        </Link>
      </nav>
      <section className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-16">
          <div className="lg:col-span-2">
            <div className="p-4 bg-white rounded-md border gap-4">
              <Suspense fallback={<ReviewFormSkeleton />}>
                <ReviewForm productId={productId} />
              </Suspense>
            </div>
          </div>
          <div className="lg:col-span-5">
            <Textarea placeholder="Want to leave a written review?" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function ReviewFormSkeleton() {
  return (
    <div className="flex flex-col gap-y-4">
      <p className="font-medium">Like it? Give it a rating</p>
      <StarPicker disabled />

      <Textarea placeholder="Want to leave a written review?" disabled />

      <Button
        variant="outline"
        disabled
        type="button"
        size="lg"
        className="bg-black text-white hover:bg-pink-400 hover:text-primary w-fit cursor-pointer"
      >
        Post review
      </Button>
    </div>
  );
}
