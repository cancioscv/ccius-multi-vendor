"use client";

import ImagePlaceholder from "@/shared/components/image-placeholder";
import { ChevronRight, Wand, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ColorSelector, Input, CustomSpecifications, CustomProperties, RichTextEditor, SizeSelector } from "@e-com/ui";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import Image from "next/image";
import { ehancements } from "@/utils/aiEnhancements";

interface UploadedImage {
  fileId: string;
  fileUrl: string;
}
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
  const [images, setImages] = useState<(UploadedImage | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const [activeEffect, setActiveEffect] = useState<string | null>(null); // AI effects
  const [processing, setProcessing] = useState(false);

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

  const { data: discountCodeData = [], isLoading: isLoadingDiscountCode } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-code");
      return res?.data?.discountCodes || [];
    },
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

  function convertFileToBase64(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  async function handleImageChange(file: File | null, index: number) {
    if (!file) return;

    try {
      setImageUploading(true);
      const fileName = await convertFileToBase64(file);

      const res = await axiosInstance.post("/product/api/upload-product-image", { fileName });

      const updatedImages = [...images];

      const uploadedImage: UploadedImage = {
        fileId: res.data.fileId,
        fileUrl: res.data.fileUrl,
      };

      updatedImages[index] = uploadedImage;

      if (index === images.length - 1 && images.length <= 8) {
        updatedImages.push(null); // limited to upload only 8 images
      }

      setImages(updatedImages);
      setValue("images", updatedImages);
    } catch (error) {
      console.error(error);
    } finally {
      setImageUploading(false);
    }
  }

  async function handleRemoveImage(index: number) {
    try {
      const updatedImages = [...images];

      const imageToDelete = updatedImages[index];

      if (imageToDelete && typeof imageToDelete === "object") {
        await axiosInstance.delete("/product/api/delete-product-image", {
          data: {
            fileId: imageToDelete.fileId,
          },
        });
      }

      updatedImages.splice(index, 1);

      // Add null placeholder
      if (!updatedImages.includes(null) && updatedImages.length < 8) {
        updatedImages.push(null);
      }

      setImages(updatedImages);
      setValue("images", updatedImages);
    } catch (error) {
      console.error(error);
    }
  }

  function handleSaveDraft() {}

  function applyTransformation(effect: string) {
    if (!selectedImage || processing) return;
    setActiveEffect(effect);
    setProcessing(true);

    try {
      const transformUrl = `${selectedImage}?tr=${effect}`;
      setSelectedImage(transformUrl);
    } catch (error) {
      console.log(error);
    } finally {
      setProcessing(false);
    }
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
              setSelectedImage={setSelectedImage}
              images={images}
              imageUploading={imageUploading}
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
                setSelectedImage={setSelectedImage}
                images={images}
                imageUploading={imageUploading}
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

              {/* <div className="mt-2">
                <label htmlFor="detailedDescription" className="bllock font-semibold text-gray-300 mb-1">
                  Detailed Description * (min. 100 words)
                  <Controller
                    name="detailedDescription"
                    control={control}
                    rules={{
                      required: "Detailed description is required.",
                      validate: (value) => {
                        const wordCount = value?.split(/\s+/).filter((word: string) => word).length;
                        return wordCount >= 100 || "Detailed description must be at least 100 words.";
                      },
                    }}
                    render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} onBlur={field.onBlur} />}
                  />
                  {errors.detailedDescription && <p className=" text-red-500 text-sx mt-1">{errors.detailedDescription.message as string}</p>}
                </label>
              </div> */}

              <div className="mt-2">
                <Input
                  label="Videl URL"
                  placeholder="https://youtube.com/embed/xyz123"
                  {...register("videoUrl", {
                    pattern: {
                      value: /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/,
                      message: "Invalid Youtube embed URL. Use format: https://youtube.com/embed/xyz123",
                    },
                  })}
                />
                {errors.videoUrl && <p className=" text-red-500 text-sx mt-1">{errors.videoUrl.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input
                  label="Regular Price"
                  placeholder="20$"
                  {...register("regularPrice", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Price must be at least 1" },
                    validate: (value) => !isNaN(value) || "Only numbers are allowed",
                  })}
                />
                {errors.regularPrice && <p className=" text-red-500 text-sx mt-1">{errors.regularPrice.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input
                  label="Sale Price *"
                  placeholder="15$"
                  {...register("salePrice", {
                    required: "Sale price is required.",
                    valueAsNumber: true,
                    min: { value: 1, message: "Sale must be at least 1" },
                    validate: (value) => {
                      if (isNaN(value)) return "Only numbers are allowed";
                      if (regularPrice && value >= regularPrice) {
                        return "Sale Price must be less than Regular Price";
                      }
                      return true;
                    },
                  })}
                />
                {errors.salePrice && <p className=" text-red-500 text-sx mt-1">{errors.salePrice.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input
                  label="Stock *"
                  placeholder="100"
                  {...register("stock", {
                    required: "Stock is required.",
                    valueAsNumber: true,
                    min: { value: 1, message: "Stock must be at least 1" },
                    max: { value: 1000, message: "Stock cannot exced 1000" },
                    validate: (value) => {
                      if (isNaN(value)) return "Only numbers are allowed";
                      if (!Number.isInteger(value)) {
                        return "Stock must be a whole number";
                      }
                      return true;
                    },
                  })}
                />
                {errors.stock && <p className=" text-red-500 text-sx mt-1">{errors.stock.message as string}</p>}
              </div>

              <div className="mt-2">
                <SizeSelector control={control} errors={errors} />
              </div>

              <div className="mt-3">
                <label htmlFor="discount" className="bllock font-semibold text-gray-300 mb-1">
                  Select Discount Codes (optional)
                </label>
                {isLoadingDiscountCode ? (
                  <p className="text-gray-400">Loading discount codes...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {discountCodeData?.map((code: any) => (
                      <button
                        key={code.id}
                        type="button"
                        className={`px-3 py-1 rounded-md text-sm font-semibold ${
                          watch("discountCodeData")?.includes(code.id)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                        }`}
                        onClick={() => {
                          const currentSelection = watch("discountCodeData") || [];
                          const updatedSelection = currentSelection?.includes(code.id)
                            ? currentSelection.filter((id: string) => id !== code.id)
                            : [...currentSelection, code.id];

                          setValue("discountCodeData", updatedSelection);
                        }}
                      >
                        {code?.publicName} ({code.discountValue} {code.discountType === "percentage" ? "%" : "$"})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {openImageModal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] text-white">
            <div className="flex justify-between items-center pb-3 mb-4">
              <h2 className="text-lg font-semibold">Enhance Product Image</h2>
              <X size={20} className="cursor-pointer" onClick={() => setOpenImageModal(!openImageModal)} />
            </div>

            <div className="w-full h-[250px] relative rounded-md overflow-hidden border border-gray-600">
              <Image src={selectedImage} alt="product-image" fill className="object-cover" unoptimized={true} />
            </div>

            {selectedImage && (
              <div className="mt-4 space-y-2">
                <h3 className="text-white text-sm font-semibold">AI Enhancements</h3>
                <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
                  {ehancements?.map(({ label, effect }) => (
                    <button
                      key={effect}
                      className={`p-2 rounded-sm flex items-center gap-2 ${
                        activeEffect === effect ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600"
                      }`}
                      onClick={() => applyTransformation(effect)}
                      disabled={processing}
                    >
                      <Wand size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        {isChanged && (
          <button type="button" onClick={handleSaveDraft} className="px-4 py-2 bg-gray-700 text-white rounded-md">
            Save Draft
          </button>
        )}

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
