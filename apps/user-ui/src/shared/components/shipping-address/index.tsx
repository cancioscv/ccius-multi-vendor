"use client";

import { countries } from "@/configs/countries";
import axiosInstance from "@/utils/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

enum ADDRESS_TYPE { // TODO: Get this enum from prisma
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}
export default function ShippingAddress() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      addressType: ADDRESS_TYPE.HOME,
      name: "",
      street: "",
      city: "",
      zip: "",
      country: "DE",
      isDefault: "false",
    },
  });

  const { mutate: addAddress } = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post("/api/add-address", payload);
      return res.data.address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      reset();
      setShowModal(false);
    },
  });

  // Get addresses
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/shipping-addresses");
      return res.data.addresses;
    },
  });

  const onSubmit = async (data: any) => {
    addAddress({
      ...data,
      isDefault: data?.isDefault === "true",
    });
  };

  const { mutate: deleteAddress } = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/delete-address/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Saved Address</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline">
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      </div>

      {/* Address List */}
      <div>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading Addresses...</p>
        ) : !addresses || addresses.length === 0 ? (
          <p className="text-sm text-gray-600">No saved addresses found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((address: any) => (
              <div key={address.id} className="border border-gray-200 rounded-md p-4 relative">
                {address.isDefault && (
                  <span className="absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">Default</span>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-700 min-h-20">
                  <MapPin className="w-5 h-5 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">
                      {address.addressType} - {address.name}
                    </p>
                    <p>
                      {address.street}, {address.city}, {address.zip}, {address.country}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4 absolute bottom-2">
                  <button
                    className="flex items-center gap-1 !cursor-pointer text-xs text-red-500 hover:underline "
                    onClick={() => deleteAddress(address.id)}
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-md shadow-md relative">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800" onClick={() => setShowModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Address</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <select {...register("addressType")} className="w-full border outline-none border-gray-300 bg-transparent rounded-md p-2">
                <option value={ADDRESS_TYPE.HOME} className="bg-black">
                  Home
                </option>
                <option value={ADDRESS_TYPE.WORK} className="bg-black">
                  Work
                </option>
                <option value={ADDRESS_TYPE.OTHER} className="bg-black">
                  Other
                </option>
              </select>

              <input
                type="text"
                placeholder="Name"
                {...register("name", { required: "Name is required" })}
                className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}

              <input
                type="text"
                placeholder="Street"
                {...register("street", { required: "Street is required" })}
                className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
              />
              {errors.street && <p className="text-red-500 text-xs">{errors.street.message}</p>}

              <input
                type="text"
                placeholder="City"
                {...register("city", { required: "City is required" })}
                className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
              />
              {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}

              <input
                type="text"
                placeholder="ZIP Code"
                {...register("zip", { required: "ZIP code is required" })}
                className="w-full p-2 border border-gray-300 rounded-[4px] mb-1 outline-none"
              />

              <select {...register("country")} className="w-full border outline-none border-gray-300 bg-transparent rounded-md p-2">
                {countries.map((country) => (
                  <option key={country.code} value={country.code} className="bg-black">
                    {country.name}
                  </option>
                ))}
              </select>

              <select {...register("isDefault")} className="w-full border outline-none border-gray-300 bg-transparent rounded-md p-2">
                <option value="true" className="">
                  Set as Default
                </option>
                <option value="false" className="">
                  Not Default
                </option>
              </select>

              <button type="submit" className="w-full bg-blue-600 text-white text-sm py-2 rounded-md hover:bg-blue-300 transition">
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
