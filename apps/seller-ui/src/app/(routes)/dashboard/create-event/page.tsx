"use client";

import Breadcrumbs from "@/shared/components/breadcrumbs";
import ImagePlaceholder from "@/shared/components/image-placeholder";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";
import { ColorSelector, CustomProperties, CustomSpecifications, Input, SizeSelector } from "@e-com/ui";
import { useQuery } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

interface UploadedImage {
  fileId: string;
  fileUrl: string;
}

export default function CreateEvent() {
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [images, setImages] = useState<(UploadedImage | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [slugValue, setSlugValue] = useState("");
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (slugValue) {
        setIsSlugChecking(true);
        axiosInstance
          .post("/product/api/slug-validator", { slug: slugValue }, isProtected)
          .then((res) => {
            if (res.data.available) {
              toast.success("Slug is available and applied!");
            } else {
              setValue("slug", res.data.slug);
              toast.info("Slug was taken. Suggested new one applied.");
            }
          })
          .catch(() => {
            toast.error("Error checking slug!");
          })
          .finally(() => {
            setIsSlugChecking(false);
          });
      }
    }, 3000);

    return () => clearTimeout(delayDebounce);
  }, [slugValue]);

  const { onChange: formOnChange, ...restSlugProps } = register("slug", {
    required: "Slug is required!",
    pattern: {
      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      message: "Invalid slug format! Use only lowercase letters, numbers, and dashes (e.g., product-slug).",
    },
    minLength: {
      value: 3,
      message: "Slug must be at least 3 characters long.",
    },
    maxLength: {
      value: 50,
      message: "Slug cannot be longer than 50 characters.",
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/product/api/categories");
        return res.data;
      } catch (error) {
        console.log(error);
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const { data: discountCodes = [], isLoading: discountLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-code");
      return res?.data?.discountCodes || [];
    },
  });

  const categories = data?.categories || [];
  const subCategoriesData = data?.subCategories || {};

  const selectedCategory = watch("category");
  const regularPrice = watch("regularPrice");

  const subcategories = useMemo(() => {
    return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
  }, [selectedCategory, subCategoriesData]);

  async function onSubmit(data: any) {
    try {
      setLoading(true);
      await axiosInstance.post("/product/api/create-product", data);
      router.push("/dashboard/all-events");
    } catch (error: any) {
      toast.error(error?.data?.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <form className="w-full mx-auto p-8 shadow-md rounded-lg text-white" onSubmit={handleSubmit(onSubmit)}>
      {/* Heading & Breadcrumbs */}
      <h2 className="text-2xl py-2 font-semibold font-Poppins text-white">Create Event</h2>
      <Breadcrumbs title="Create Event" />

      {/* Content Layout */}
      <div className="py-4 w-full flex gap-6">
        {/* Left side - Image upload section */}
        <div className="md:w-[35%]">
          {images?.length > 0 && (
            <ImagePlaceholder
              size="765 x 850"
              index={0}
              onImageChange={handleImageChange}
              onRemove={handleRemoveImage}
              images={images}
              imageUploading={imageUploading}
            />
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {images.slice(1).map((_, index) => (
              <ImagePlaceholder
                key={index}
                size="765 x 850"
                small
                index={index + 1}
                onImageChange={handleImageChange}
                onRemove={handleRemoveImage}
                images={images}
                imageUploading={imageUploading}
              />
            ))}
          </div>
        </div>

        {/* Right side - form inputs */}
        <div className="md:w-[65%]">
          <div className="w-full flex gap-6">
            {/* Product Title Input */}
            <div className="w-2/4">
              <Input label="Product Title *" placeholder="Enter product title" {...register("title", { required: "Title is required" })} />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}

              <div className="mt-2">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Short Description * (Max 150 words)"
                  placeholder="Enter product description for quick view"
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
                  placeholder="apple,flagship"
                  {...register("tags", {
                    required: "Seperate related products tags with a coma,",
                  })}
                />
                {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags.message as string}</p>}
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">Starting Date *</label>
                <input
                  type="date"
                  className={`w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white`}
                  {...register("startingDate", {
                    required: "Starting Date is required!",
                  })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="mt-2">
                <Input
                  label="Warranty *"
                  placeholder="1 Year / No Warranty"
                  {...register("warranty", {
                    required: "Warranty is required!",
                  })}
                />
                {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags.message as string}</p>}
              </div>

              <div className="mt-2">
                <div className="relative">
                  <Input
                    label="Slug *"
                    placeholder="product_slug"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSlugValue(e.target.value);
                      setValue("slug", e.target.value);
                      formOnChange(e);
                    }}
                    value={watch("slug")}
                    className="pr-10"
                    {...restSlugProps}
                  />

                  <div className="absolute w-7 h-7 flex items-center justify-center bg-blue-600 !rounded shadow top-[70%] right-3 transform -translate-y-1/2 text-white cursor-pointer hover:bg-blue-700">
                    <Wand2
                      size={16}
                      onClick={async () => {
                        const title = getValues("title");
                        if (!title) {
                          toast.error("Please enter a event title to generate a slug!");
                          return;
                        }

                        // Generate slug from title
                        const rawSlug = title
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9\s-]/g, "")
                          .replace(/\s+/g, "-")
                          .replace(/-+/g, "-");

                        try {
                          // Check slug validity via API
                          const res = await axiosInstance.post("/product/api/slug-validator", { slug: rawSlug });
                          const { available, suggestedSlug } = res.data;

                          if (available) {
                            setValue("slug", rawSlug);
                            toast.success("Slug is available!");
                          } else if (suggestedSlug) {
                            setValue("slug", suggestedSlug);
                            toast.info("Slug not available, suggested new one!");
                          } else {
                            toast.error("Slug is already taken, try editing it.");
                          }
                        } catch (err) {
                          toast.error("Failed to validate slug. Try again.");
                        }
                      }}
                    />
                  </div>
                </div>

                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input label="Brand" placeholder="Apple" {...register("brand")} />
                {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags.message as string}</p>}
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
                <label className="block font-semibold text-gray-300 mb-1">Cash On Delivery *</label>
                <select
                  {...register("cashOnDelivery", {
                    required: "Cash on Delivery is required",
                  })}
                  defaultValue="yes"
                  className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white"
                >
                  <option value="yes" className="bg-black">
                    Yes
                  </option>
                  <option value="no" className="bg-black">
                    No
                  </option>
                </select>
                {errors.cashOnDelivery && <p className="text-red-500 text-xs mt-1">{errors.cashOnDelivery.message as string}</p>}
              </div>
            </div>
            <div className="w-2/4">
              <label className="block font-semibold text-gray-300 mb-1">Category *</label>
              {isLoading ? (
                <p className="text-gray-400">Loading categories...</p>
              ) : isError ? (
                <p className="text-red-500">Failed to load categories</p>
              ) : (
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <select {...field} className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white">
                      <option value="" className="bg-black">
                        Select Category
                      </option>
                      {categories?.map((category: string) => (
                        <option value={category} key={category} className="bg-black">
                          {category}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message as string}</p>}

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">Subcategory *</label>
                <Controller
                  name="subCategory"
                  control={control}
                  rules={{ required: "Subcategory is required" }}
                  render={({ field }) => (
                    <select {...field} className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white">
                      <option value="" className="bg-black">
                        Select Subcategory
                      </option>
                      {subcategories?.map((subcategory: string) => (
                        <option key={subcategory} value={subcategory} className="bg-black">
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.subcategory && <p className="text-red-500 text-xs mt-1">{errors.subcategory.message as string}</p>}
              </div>

              <div className="mt-6 mb-6">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Detailed Description * (min. 100 words)"
                  placeholder="Enter product detailed description."
                  {...register("detailedDescription", {
                    required: "Detailed Description is required",
                    validate: (value) => {
                      const wordCount = value?.split(/\s+/).filter((word: string) => word).length;
                      return wordCount >= 100 || "Detailed description must be at least 100 words.";
                    },
                  })}
                />
              </div>

              {/* <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">Detailed Description * (Min 100 words)</label>
                <Controller
                  name="detailedDescription"
                  control={control}
                  rules={{
                    required: "Detailed description is required!",
                    validate: (value) => {
                      const wordCount = value?.split(/\s+/).filter((word: string) => word).length;
                      return wordCount >= 100 || "Description must be at least 100 words!";
                    },
                  }}
                  render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />}
                />
                {errors.detailed_description && <p className="text-red-500 text-xs mt-1">{errors.detailed_description.message as string}</p>}
              </div> */}

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">Ending Date *</label>
                <input
                  type="date"
                  className={`w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white`}
                  {...register("endingDate", {
                    required: "Ending Date is required!",
                  })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="mt-2">
                <Input
                  label="Video URL"
                  placeholder="https://www.youtube.com/embed/xyz123"
                  {...register("videoUrl", {
                    pattern: {
                      value: /^https:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+$/,
                      message: "Invalid YouTube embed URL! Use format: https://www.youtube.com/embed/xyz123",
                    },
                  })}
                />
                {errors.videoUrl && <p className="text-red-500 text-xs mt-1">{errors.videoUrl.message as string}</p>}
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
                {errors.regularPrice && <p className="text-red-500 text-xs mt-1">{errors.regularPrice.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input
                  label="Sale Price *"
                  placeholder="15$"
                  {...register("salePrice", {
                    required: "Sale Price is required",
                    valueAsNumber: true,
                    min: { value: 1, message: "Sale Price must be at least 1" },
                    validate: (value) => {
                      if (isNaN(value)) return "Only numbers are allowed";
                      if (regularPrice && value >= regularPrice) {
                        return "Sale Price must be less than Regular Price";
                      }
                      return true;
                    },
                  })}
                />
                {errors.salePrice && <p className="text-red-500 text-xs mt-1">{errors.salePrice.message as string}</p>}
              </div>

              <div className="mt-2">
                <Input
                  label="Stock *"
                  placeholder="100"
                  {...register("stock", {
                    required: "Stock is required!",
                    valueAsNumber: true,
                    min: { value: 1, message: "Stock must be at least 1" },
                    max: {
                      value: 1000,
                      message: "Stock cannot exceed 1,000",
                    },
                    validate: (value) => {
                      if (isNaN(value)) return "Only numbers are allowed!";
                      if (!Number.isInteger(value)) return "Stock must be a whole number!";
                      return true;
                    },
                  })}
                />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message as string}</p>}
              </div>

              <div className="mt-2">
                <SizeSelector control={control} errors={errors} />
              </div>

              <div className="mt-3">
                <label className="block font-semibold text-gray-300 mb-1">Select Discount Codes (optional)</label>

                {discountLoading ? (
                  <p className="text-gray-400">Loading discount codes...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {discountCodes?.map((code: any) => (
                      <button
                        key={code.id}
                        type="button"
                        className={`px-3 py-1 rounded-md text-sm font-semibold border ${
                          watch("discountCodes")?.includes(code.id)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                        }`}
                        onClick={() => {
                          const currentSelection = watch("discountCodes") || [];
                          const updatedSelection = currentSelection?.includes(code.id)
                            ? currentSelection.filter((id: string) => id !== code.id)
                            : [...currentSelection, code.id];
                          setValue("discountCodes", updatedSelection);
                        }}
                      >
                        {code?.publicName} ({code.discountValue}
                        {code.discountType === "percentage" ? "%" : "$"})
                      </button>
                    ))}
                  </div>
                )}

                {discountCodes?.length === 0 && <p className="text-gray-400">No discount codes available yet!</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
