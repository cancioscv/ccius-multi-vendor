import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import axios from "axios";
import { shopCategories } from "@/utils/categories";

interface CreateShopProps {
  sellerId: string;
  setActiveStep: (step: number) => void;
}
export default function CreateShop({ sellerId, setActiveStep }: CreateShopProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const createShopMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/create-shop`, { data });
      return response.data;
    },
    onSuccess: () => {
      setActiveStep(3);
    },
  });

  async function onSubmit(data: any) {
    const shopData = { ...data, sellerId };
    createShopMutation.mutate(shopData);
  }

  const countWords = (text: string) => text.trim().split(/\S+/).length;

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-2xl font-semibold text-center mb-4">Setup new shop</h3>

        <label htmlFor="name" className="block text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          placeholder="Shop name"
          className="w-full p-2 border border-gray-300 outline-none rounded-[4px] mb-1"
          {...register("name", {
            required: "Name is required",
          })}
        />
        {errors.name && <p className="text-red-500 text-sm">{String(errors.name.message)}</p>}

        <label htmlFor="address" className="block text-gray-700 mt-2">
          Address *
        </label>
        <input
          type="text"
          id="address"
          placeholder="Shop location"
          className="w-full p-2 border border-gray-300 outline-none rounded-[4px] mb-1"
          {...register("address", {
            required: "Address is required",
          })}
        />
        {errors.address && <p className="text-red-500 text-sm">{String(errors.address.message)}</p>}

        <label htmlFor="openingHours" className="block text-gray-700 mt-2">
          Opening Hours *
        </label>
        <input
          type="text"
          id="openingHours"
          placeholder="e.g. Mon-Fri 9am - 6pm"
          className="w-full p-2 border border-gray-300 outline-none rounded-[4px] mb-1"
          {...register("openingHours", {
            required: "Address is required",
          })}
        />
        {errors.openingHours && <p className="text-red-500 text-sm">{String(errors.openingHours.message)}</p>}

        <label htmlFor="website" className="block text-gray-700 mt-2">
          Website
        </label>
        <input
          type="url"
          id="website"
          placeholder="https://example.com"
          className="w-full p-2 border border-gray-300 outline-none rounded-[4px] mb-1"
          {...register("website", {
            pattern: {
              value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-]*)*$/,
              message: "Enter a valid URL",
            },
          })}
        />
        {errors.website && <p className="text-red-500 text-sm">{String(errors.website.message)}</p>}

        <label htmlFor="category" className="block text-gray-700 mt-2">
          Category *
        </label>
        <select
          className="w-full p-2 border border-gray-300 outline-none rounded-[4px] mb-1"
          {...register("category", { required: "Cateegory is required" })}
        >
          <option value="">Select a category</option>
          {shopCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-sm">{String(errors.category.message)}</p>}

        <label htmlFor="bio" className="block text-gray-700 mt-2">
          Bio (max. 100 words) *
        </label>
        <textarea
          id="bio"
          cols={10}
          rows={4}
          placeholder="Shop biografy"
          className="w-full p-2 border border-gray-300 outline-none rounded-[4px] mb-1"
          {...register("bio", {
            required: "Shop bio is required.",
            validate: (value) => countWords(value) <= 100 || "Bio can not exceed 100 words.",
          })}
        />
        {errors.bio && <p className="text-red-500 text-sm">{String(errors.bio.message)}</p>}

        <button type="submit" className="w-full text-lg bg-blue-600 text-white py-2 rounded-lg mt-4">
          Create shop
        </button>
      </form>
    </div>
  );
}
