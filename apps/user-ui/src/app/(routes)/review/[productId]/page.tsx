"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useParams } from "next/navigation";

export default function ProductReview() {
  const params = useParams();

  const productId = params.productId as string;

  async function createReview(formData: FormData) {
    const rating = Number(formData.get("rating"));
    const comment = formData.get("comment") as string;

    try {
      const res = await axiosInstance.post("/product/api/create-review", { rating, comment, productId });
      return res.data;
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <form action={createReview} className="space-y-4">
      <select name="rating" className="border p-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <option key={num} value={num}>
            {num} Stars
          </option>
        ))}
      </select>

      <textarea name="comment" placeholder="Write your review..." className="w-full border p-2" required />

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Submit Review
      </button>
    </form>
  );
}
