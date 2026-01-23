"use client";

import useSeller from "@/hooks/useSeller";
import axiosInstance from "@/utils/axiosInstance";
import { Input } from "@e-com/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { toast } from "react-toastify";

interface SocialLink {
  type: string;
  url: string;
}

interface SellerProfile {
  name: string;
  bio: string;
  openingHours: string;
  address: string;
  website: string;
  socialLinks: SocialLink[];
}

const socialMediaOptions = [
  { label: "Facebook", value: "facebook" },
  { label: "YouTube", value: "youtube" },
  { label: "X (Twitter)", value: "x" },
];

async function updateSellerProfile(data: SellerProfile) {
  const response = await axiosInstance.put("/seller/api/edit-seller-shop", data);
  return response.data;
}

export default function EditProfile() {
  const { seller } = useSeller();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SellerProfile>({
    defaultValues: {
      name: seller?.shop?.name || "",
      bio: seller?.shop?.bio || "",
      openingHours: seller?.shop?.openingHours || "Mon - Sat: 9 AM - 6 PM",
      address: seller?.shop?.address || "",
      website: seller?.shop?.website || "",
      socialLinks: seller?.shop?.socialLinks || [{ type: "facebook", url: "" }],
    },
  });

  const socialLinks = watch("socialLinks");

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: updateSellerProfile,
    onSuccess: (data) => {
      toast.success(data.message || "Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["seller"] });
      router.push("/");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update profile!");
    },
  });

  // Form Submit Handler
  function onSubmit(data: FieldValues) {
    updateProfile(data as SellerProfile);
  }

  // Add New Social Link
  function addSocialLink() {
    setValue("socialLinks", [...socialLinks, { type: "facebook", url: "" }]);
  }

  // Remove Social Link
  function removeSocialLink(index: number) {
    const updatedLinks = socialLinks.filter((_, i) => i !== index);
    setValue("socialLinks", updatedLinks);
  }

  function countWords(text: string) {
    return text.trim().split(/\s+/).length;
  }

  return (
    <div className="w-full bg-gray-900 min-h-screen py-10 px-6">
      {/* 🔙 Back Button & Breadcrumbs */}
      <div className="absolute top-10 left-5">
        <div className="text-gray-400 text-sm mb-6 flex items-center gap-2">
          <button onClick={() => router.push("/")} className="flex items-center gap-1 text-gray-300 hover:text-white transition">
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Profile</span>
          </button>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-white font-medium">Edit Profile</span>
        </div>
      </div>

      <div className="max-w-[50%] lg:max-w-[40%] mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-6">Edit Shop Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Shop Name */}
          <Input label="Shop Name" {...register("name", { required: "Shop name is required" })} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}

          {/* Shop Bio (Limited to 100 Words) */}
          <div className="mt-1">
            <Input
              type="textarea"
              label="Shop Bio (Max 100 words)"
              {...register("bio", {
                validate: (value) => countWords(value) <= 100 || "Bio can't exceed 100 words",
              })}
            />
          </div>

          {/* Opening Hours */}
          <Input label="Opening Hours" {...register("openingHours")} />

          <div className="mt-1">
            {/* Address */}
            <Input label="Shop Address" {...register("address")} />
          </div>

          {/* Website */}
          <Input
            label="Website"
            {...register("website", {
              pattern: {
                value: /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{2,256}\.[a-z]{2,6}\b)(\/[^\s]*)?$/,
                message: "Enter a valid URL",
              },
            })}
          />
          {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}

          {/* Social Links */}
          <div className="mt-4">
            <label className="block font-semibold text-gray-300">Social Links</label>
            {socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2 mt-1 items-center">
                {/* Social Media Type Selection */}
                <Controller
                  control={control}
                  name={`socialLinks.${index}.type`}
                  render={({ field }) => (
                    <select {...field} className="w-32 p-2 rounded-md bg-gray-700 text-white outline-none border border-gray-600">
                      {socialMediaOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />

                {/* Social Media URL Input */}
                <Controller
                  control={control}
                  name={`socialLinks.${index}.url`}
                  rules={{
                    pattern: {
                      value: /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{1,256}\.[a-z]{1,6}\b)(\/[^\s]*)?$/,
                      message: `Enter a valid ${socialLinks[index]?.type} URL`,
                    },
                  }}
                  render={({ field }) => (
                    <div className="flex flex-col w-full">
                      {/* ✅ Ensure full width */}
                      <Input {...field} className="w-full" placeholder={`Enter ${socialLinks[index]?.type} URL`} />
                      {/* ✅ Show Validation Error */}
                      {errors.socialLinks?.[index]?.url && <p className="text-red-500 text-xs mt-1">{errors.socialLinks[index]?.url?.message}</p>}
                    </div>
                  )}
                />

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className="bg-red-600 p-2 rounded-md text-white hover:bg-red-700 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            {/* Add Social Link Button */}
            <button type="button" onClick={addSocialLink} className="mt-3 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              + Add Social Link
            </button>
          </div>

          {/* Save Button with Loader */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 mt-6 rounded-md font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
