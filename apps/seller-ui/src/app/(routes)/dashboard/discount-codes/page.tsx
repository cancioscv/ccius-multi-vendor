"use client";

import DeleteDiscountCodes from "@/shared/components/modals/delete-discount-codes";
import axiosInstance from "@/utils/axiosInstance";
import { Input } from "@e-com/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ChevronRight, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

export default function DiscountCodesPage() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      publicName: "",
      discountType: "percentage",
      discountValue: "",
      discountCode: "",
    },
  });

  const { data: discountCodeData = [], isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-code");
      return res?.data?.discountCodes || [];
    },
  });

  const createDiscountCodeMutation = useMutation({
    mutationFn: async (data) => {
      await axiosInstance.post("/product/api/create-discount-code", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      reset();
      setShowModal(false);
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (discountId) => {
      await axiosInstance.delete(`/product/api/delete-discount-code/${discountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setShowDeleteModal(false);
    },
  });

  async function handleDeleteDiscount(discount: any) {
    setSelectedDiscount(discount);
    setShowDeleteModal(true);
  }

  function onSubmit(data: any) {
    if (discountCodeData.length >= 8) {
      toast.error("You can only create up t0 8 discount codes.");
      return;
    }

    createDiscountCodeMutation.mutate(data);
  }

  return (
    <div className="w-full min-h-screen p-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl text-white font-semibold">Discount Codes</h2>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Create Discount
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center text-white">
        <Link href="/" className="text-[#80deea] cursor-pointer">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Discount Codes</span>
      </div>

      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Your Discount Codes</h3>
        {isLoading ? (
          <p className="text-gray-400 text-center">Loading discounts...</p>
        ) : (
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-x-gray-800">
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discountCodeData?.map((discount: any) => (
                <tr key={discount?.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                  <td className="p-3">{discount?.publicName}</td>
                  <td className="p-3 capitalize">{discount.discountType === "percentage" ? "Percentage (%)" : "Flat ($)"}</td>
                  <td className="p-3">{discount.discountType === "percentage" ? `${discount.discountValue}%` : `$${discount.discountValue}`}</td>
                  <td className="p-3">{discount.discountCode}</td>
                  <td className="p-3">
                    <button className="text-red-400 hover:text-red-300 transition" onClick={() => handleDeleteDiscount(discount)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && discountCodeData?.length === 0 && <p className="text-gray-400 pt-4 text-center">No Discount Codes Available</p>}
      </div>

      {/* Create Discount modal */}
      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-xl text-white">Create Discount Code</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              <Input
                label="Title (Public Name)"
                {...register("publicName", {
                  required: "Title is required",
                })}
              />
              {errors.publicName && <p className="text-red-500 text-xs mt-1">{errors.publicName.message as string}</p>}

              <div className="mt-2 text-white">
                <label className="block font-semibold text-gray-300 mb-1">Discount Type</label>
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="w-full border outline-none border-gray-700 bg-transparent rounded-md p-2">
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount ($)</option>
                    </select>
                  )}
                />
              </div>

              <div className="mt-2">
                <Input
                  label="Discount Value"
                  type="number"
                  min={1}
                  {...register("discountValue", {
                    required: "Value is required",
                  })}
                />
              </div>

              <div className="mt-2">
                <Input
                  label="Discount Code"
                  min={1}
                  {...register("discountCode", {
                    required: "Discount code is required",
                  })}
                />
              </div>
              <button
                type="submit"
                disabled={createDiscountCodeMutation.isPending}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={18} /> {createDiscountCodeMutation?.isPending ? "Creating..." : "Create"}
              </button>
              {createDiscountCodeMutation.isError && (
                <p className="text-red-500 text-xs mt-2">
                  {(createDiscountCodeMutation.error as AxiosError<{ message: string }>)?.response?.data?.message || "Something went wrong!"}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedDiscount && (
        <DeleteDiscountCodes
          discount={selectedDiscount}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => deleteDiscountMutation.mutate((selectedDiscount as any)?.id)}
        />
      )}
    </div>
  );
}
