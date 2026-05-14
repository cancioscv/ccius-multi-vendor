"use client";

import { countries } from "@/configs/countries";
import axiosInstance from "@/utils/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Briefcase, MapPin, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

enum ADDRESS_TYPE { // TODO: Get this enum from prisma
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}

const addressTypeIcon: Record<string, any> = {
  HOME: Home,
  WORK: Briefcase,
  OTHER: MapPin,
};

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

  const { mutate: setDefaultAddress } = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.put(`/api/set-default-address/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
    },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage where your orders are delivered.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-sm text-white bg-[#e07b39] rounded-lg px-4 py-2 hover:bg-[#c96a2a] transition flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add address
        </button>
      </div>

      {/* Address Cards */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading addresses...</p>
      ) : !addresses || addresses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((address: any) => {
            const TypeIcon = addressTypeIcon[address.addressType] || MapPin;
            return (
              <div
                key={address.id}
                className={`border rounded-xl p-4 relative transition ${
                  address.isDefault ? "border-orange-200 bg-orange-50/30" : "border-gray-200 bg-white"
                }`}
              >
                {/* Address type + default badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${address.isDefault ? "bg-orange-100" : "bg-gray-100"}`}>
                      <TypeIcon className={`w-3.5 h-3.5 ${address.isDefault ? "text-[#e07b39]" : "text-gray-400"}`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 capitalize">
                      {address.addressType.charAt(0) + address.addressType.slice(1).toLowerCase()}
                    </span>
                    {address.isDefault && (
                      <span className="text-[10px] font-bold bg-[#e07b39] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Default</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      title="Edit address"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                      onClick={() => deleteAddress(address.id)}
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Address details */}
                <div className="text-sm text-gray-600 space-y-0.5 pl-9">
                  <p className="font-medium text-gray-800">{address.name}</p>
                  <p className="flex items-center gap-1 text-gray-500 text-xs">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {address.street}
                  </p>
                  <p className="text-xs text-gray-500 pl-4">
                    {address.zip} {address.city}, {address.country}
                  </p>
                </div>

                {/* Set as default */}
                {!address.isDefault && (
                  <button
                    onClick={() => setDefaultAddress(address.id)}
                    className="mt-4 w-full text-xs text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 hover:border-gray-300 transition"
                  >
                    Set as default
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Address Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative">
            <div className="flex items-center justify-between p-6 pb-0">
              <h3 className="text-lg font-bold text-gray-900">Add New Address</h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition"
                onClick={() => setShowModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-3">
              {/* Address type */}
              <select
                {...register("addressType")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e07b39] bg-white text-gray-700 transition"
              >
                <option value={ADDRESS_TYPE.HOME}>Home</option>
                <option value={ADDRESS_TYPE.WORK}>Work</option>
                <option value={ADDRESS_TYPE.OTHER}>Other</option>
              </select>

              <input
                type="text"
                placeholder="Full name"
                {...register("name", { required: "Name is required" })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e07b39] transition"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message as string}</p>}

              <input
                type="text"
                placeholder="Street address"
                {...register("street", { required: "Street is required" })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e07b39] transition"
              />
              {errors.street && <p className="text-red-500 text-xs">{errors.street.message as string}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="City"
                    {...register("city", { required: "City is required" })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e07b39] transition"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message as string}</p>}
                </div>
                <input
                  type="text"
                  placeholder="ZIP code"
                  {...register("zip", { required: "ZIP is required" })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e07b39] transition"
                />
              </div>

              <select
                {...register("country")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e07b39] bg-white text-gray-700 transition"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>

              <select
                {...register("isDefault")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#e07b39] bg-white text-gray-700 transition"
              >
                <option value="true">Set as default</option>
                <option value="false">Not default</option>
              </select>

              <button
                type="submit"
                className="w-full bg-[#e07b39] text-white text-sm py-2.5 rounded-xl hover:bg-[#c96a2a] transition font-medium mt-1"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
