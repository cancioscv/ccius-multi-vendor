"use client";

import ImagePlaceholder from "@/shared/components/image-placeholder";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ColorSelector, Input, CustomSpecifications, CustomProperties } from "@e-com/ui";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";

export default function CreateProductPage() {
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [openImageModal, setOpenImageModal] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [images, setImages] = useState<(File | null)[]>([null]);
  const [loading, setLoading] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/product/api/categories");
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
    staleTime: 1000 * 60 * 5, // Caching time
    retry: 2,
  });

  const categories = data?.categories || [];
  const subCategoriesData = data?.subCategories || {};

  const selectedCategory = watch("category");
  const regularPrice = watch("regular_price");

  const subCategories = useMemo(() => {
    return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
  }, [selectedCategory, subCategoriesData]);

  function onSubmit(data: any) {
    console.log(data);
  }

  function handleImageChange(file: File | null, index: number) {
    const updatedImages = [...images];
    updatedImages[index] = file;

    if (index === images.length - 1 && images.length < 8) {
      updatedImages.push(null);
    }

    setImages(updatedImages);
    setValue("images", updatedImages);
  }

  function handleRemoveImage(index: number) {
    setImages((prevImages) => {
      let updatedImages = [...prevImages];

      if (index === -1) {
        updatedImages[0] = null;
      } else {
        updatedImages.splice(index, 1);
      }

      if (!updatedImages.includes(null) && updatedImages.length < 8) {
        updatedImages.push(null);
      }

      return updatedImages;
    });

    setValue("images", images);
  }

  return (
    <form className="w-full mx-auto p-8 shadow-md rounded-lg text-white" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-2xl py-2 font-semibold font-Poppins">Create Product</h2>
      <div className="flex items-center">
        <span className="text-[#80deea] cursor-pointer">Dashboard</span>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Create Product</span>
      </div>

      {/* Content layout */}
      <div className="py-4 w-full flex gap-6">
        <div className="md:w-[35%]">
          {images?.length > 0 && (
            <ImagePlaceholder
              setOpenImageModal={setOpenImageModal}
              size="765 x 850"
              index={0}
              onImageChange={handleImageChange}
              onRemove={handleRemoveImage}
            />
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {images.slice(1).map((_, index) => (
              <ImagePlaceholder
                setOpenImageModal={setOpenImageModal}
                key={index}
                size="765 x 850"
                small
                index={index + 1}
                onImageChange={handleImageChange}
                onRemove={handleRemoveImage}
              />
            ))}
          </div>
        </div>

        {/* Form inputs - right side */}
        <div className="md:w-[65%]">
          <div className="w-full flex gap-6">
            <div className="w-2/4">
              <Input label="Product Title *" placeholder="Enter product title" {...register("title", { required: "Title is required." })} />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}

              <div className="mt-2">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Short Description * (max. 150 words)"
                  placeholder="Enter product description for quick view."
                  {...register("description", {
                    required: "Description is required",
                    validate: (value) => {
                      const wordCount = value.trim().split(/\s+/).length;
                      return wordCount <= 150 || `Description cannot exceed 150 words (Current: ${wordCount})`;
                    },
                  })}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input
                  label="Tags *"
                  placeholder="apple, flagship"
                  {...register("tags", {
                    required: "Separate related products tags with a coma",
                  })}
                />
                {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input
                  label="Warranty *"
                  placeholder="1 Year / No Warranty"
                  {...register("warranty", {
                    required: "Warranty is required",
                  })}
                />
                {errors.warranty && <p className="text-red-500 text-xs mt-1">{errors.warranty.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input
                  label="Slug *"
                  placeholder="product_slug"
                  {...register("slug", {
                    required: "Slug is required",
                    pattern: {
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message: "Invalid slug format. Use only lowercase letters, numbers",
                    },
                    minLength: {
                      value: 3,
                      message: "Slug must be at least 3 characters long.",
                    },
                    maxLength: {
                      value: 50,
                      message: "Slug cannot be longer than 50 characters.",
                    },
                  })}
                />
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input label="Brand *" placeholder="Apple" {...register("brand")} />
                {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message as string}</p>}
              </div>

              <div className="mt-2">
                <ColorSelector control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <CustomSpecifications control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <CustomProperties control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">Cash On Devlivery *</label>
                <select
                  className="w-full border outline-none border-gray-700 bg-transparent rounded-md p-2"
                  defaultValue="yes"
                  {...register("cashOnDelivery", {
                    required: "Cash on Delivery is required.",
                  })}
                >
                  <option value="yes" className="bg-black">
                    Yes
                  </option>
                  <option value="no" className="bg-black">
                    No
                  </option>
                </select>
                {errors.cashOnDelivery && <p className="text-red-500 text-sm mt-1">{errors.cashOnDelivery.message as string}</p>}
              </div>
            </div>
            <div className="w-2/4">
              <label htmlFor="category" className="block font-semibold text-gray-300 mb-1">
                Category *
              </label>
              {isLoading ? (
                <p className="text-gray-400">Loading...</p>
              ) : isError ? (
                <p className="text-red-500">Failed to load categories</p>
              ) : (
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "Category is required." }}
                  render={({ field }) => (
                    <select {...field} className="w-full border outline-none border-gray-700 bg-transparent rounded-md p-2">
                      <option value={""} className="bg-black">
                        Select Category
                      </option>
                      {categories?.map((category: string) => (
                        <option key={category} value={category} className="bg-black">
                          {category}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.category && <p className=" text-red-500 text-sx mt-1">{errors.category.message as string}</p>}

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">Subcategory *</label>
                <Controller
                  name="subCategory"
                  control={control}
                  rules={{ required: "'Subcategory is required." }}
                  render={({ field }) => (
                    <select {...field} className="w-full border outline-none border-gray-700 bg-transparent rounded-md p-2">
                      <option value={""} className="bg-black">
                        Select Subcategory
                      </option>
                      {subCategories?.map((subCategory: string) => (
                        <option key={subCategory} value={subCategory} className="bg-black">
                          {subCategory}
                        </option>
                      ))}
                    </select>
                  )}
                />

                {errors.subCategories && <p className=" text-red-500 text-sx mt-1">{errors.subCategories.message as string}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
