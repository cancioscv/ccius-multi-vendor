"use client";

import useSeller from "@/hooks/useSeller";
import CustomDomains from "@/shared/module/settings/custom-domains";
import WithdrawMethod from "@/shared/module/settings/withdraw-method";
import axiosInstance from "@/utils/axiosInstance";
import { Input } from "@e-com/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, ChevronDownCircle, ChevronRight, ChevronRightCircle, Save, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

const tabs = [
  { key: "general", label: "General" },
  { key: "custom-domains", label: "Custom Domains" },
  { key: "withdraw", label: "Withdraw Method" },
];

export default function SettingPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { seller } = useSeller();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      lowStockThreshold: "10",
      notificationPreference: "email",
      termsURL: "",
      privacyURL: "",
      refundURL: "",
    },
  });

  // TODO: Move axiosInstance to packages/libs
  const deleteShopMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.delete("/seller/api/delete-shop-seller");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Shop marked for deletion. It will be removed in 28 days.");
      queryClient.invalidateQueries({ queryKey: ["seller"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete shop. Try again.");
    },
  });

  const restoreShopMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.patch("/seller/api/restore-shop-seller");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Shop restored successfully!");
      queryClient.invalidateQueries({ queryKey: ["seller"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to Restore shop. Try again.");
    },
  });

  function deleteShopHandler() {
    if (seller?.isDeleted) {
      restoreShopMutation.mutate();
    } else {
      deleteShopMutation.mutate();
    }
    setShowDeleteModal(false);
  }

  function onSubmit(data: any) {
    console.log("Settings Updated:", data);
    alert("Settings saved successfully!");
  }

  // Toggle Sections (Prevents accidental collapse when clicking inputs)
  function toggleSection(section: string) {
    setExpandedSection((prev) => (prev === section ? null : section));
  }

  return (
    <div className="w-full min-h-screen p-8">
      {/* Header & Breadcrumbs */}
      <h2 className="text-2xl text-white font-semibold">Settings</h2>
      <div className="flex items-center mb-6">
        <a href="/dashboard" className="text-blue-400 cursor-pointer">
          Dashboard
        </a>
        <ChevronRight size={20} className="text-gray-200" />
        <span className="text-white">Settings</span>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-6 text-lg font-semibold transition ${
              activeTab === tab.key ? "text-white border-b-2 border-blue-500" : "text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="max-w-2xl space-y-6">
          {/* Low Stock Alert */}
          <div className="px-4 rounded-lg cursor-pointer">
            <div className="flex justify-between items-center" onClick={() => toggleSection("lowStock")}>
              <div className="flex items-center gap-3">
                <Bell size={22} className="text-blue-400" />
                <div>
                  <h3 className="text-white font-semibold">Low Stock Alert Threshold</h3>
                  <p className="text-gray-400 text-sm">Get notified when stock falls below the set limit.</p>
                </div>
              </div>
              {expandedSection === "lowStock" ? (
                <ChevronDownCircle size={22} className="text-gray-400" />
              ) : (
                <ChevronRightCircle size={22} className="text-gray-400" />
              )}
            </div>

            {expandedSection === "lowStock" && (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 border-t border-gray-700 pt-4">
                <Input
                  type="number"
                  label="Threshold Value"
                  min="1"
                  {...register("lowStockThreshold", { required: "Required" })}
                  onClick={(e: any) => e.stopPropagation()}
                />
                {errors.lowStockThreshold && <p className="text-red-500 text-xs mt-1">{errors.lowStockThreshold.message}</p>}
                <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                  <Save size={18} /> Save Changes
                </button>
              </form>
            )}
          </div>

          {/* Order Notification Preferences */}
          <div className="px-4 rounded-lg cursor-pointer">
            <div className="flex justify-between items-center" onClick={() => toggleSection("notifications")}>
              <div className="flex items-center gap-3">
                <Shield size={22} className="text-yellow-400" />
                <div>
                  <h3 className="text-white font-semibold">Order Notification Preferences</h3>
                  <p className="text-gray-400 text-sm">Choose how you receive order notifications (Email, Web, App).</p>
                </div>
              </div>
              {expandedSection === "notifications" ? (
                <ChevronDownCircle size={22} className="text-gray-400" />
              ) : (
                <ChevronRightCircle size={22} className="text-gray-400" />
              )}
            </div>

            {expandedSection === "notifications" && (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 border-t border-gray-700 pt-4">
                <select
                  {...register("notificationPreference", {
                    required: "Required",
                  })}
                  className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="email">Email</option>
                  <option value="web">Web Push Notification</option>
                  <option value="app">App Push Notification</option>
                  <option value="all">All of the above</option>
                </select>
                <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                  <Save size={18} /> Save Changes
                </button>
              </form>
            )}
          </div>

          {/* Danger Zone */}
          <div className="mt-10 border-t border-gray-700 pt-6">
            <h3 className="text-xl text-red-500 font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle size={22} className="text-red-500" />
              Danger Zone
            </h3>
            <div className="flex justify-between items-center p-4 rounded-lg cursor-pointer" onClick={() => setShowDeleteModal(true)}>
              <div className="flex items-center gap-3">
                <Trash2 size={22} className="text-white" />
                <div>
                  <h3 className="text-white font-semibold">Delete Shop</h3>
                  <p className="text-red-400 text-sm">Deleting your shop is irreversible. Proceed with caution.</p>
                </div>
              </div>
              <ChevronRightCircle size={22} className="text-white" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "custom-domains" && <CustomDomains />}

      {activeTab === "withdraw" && <WithdrawMethod />}
      {/* Delete Shop Modal */}
      {showDeleteModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
            {/* Header */}
            <h3 className="text-xl text-white mb-4 flex items-center gap-2">
              <Trash2 size={22} className="text-red-500" /> Delete Shop
            </h3>

            {/* Warning Message */}
            <p className="text-gray-300">
              Deleting your shop is a **permanent action**. However, you have **28 days** to restore your shop before it is permanently removed.
            </p>

            <p className="text-gray-300 mt-3">
              <span className="text-yellow-400 font-semibold">⚠️ Important:</span> Once the shop is permanently deleted, you **cannot** create a new
              account with the same email in the future.
            </p>

            {/* Recovery Period Warning */}
            <div className="bg-gray-900 text-yellow-400 p-3 mt-4 rounded-md border border-yellow-500">
              <p className="text-sm">
                You can **restore** your shop within 28 days from the date of deletion. After that, it will be **permanently removed**.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowDeleteModal(false)} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition">
                Cancel
              </button>
              <button
                className={`${
                  !seller?.isDeleted ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                } px-4 py-2 rounded-md text-white font-semibold transition`}
                onClick={deleteShopHandler}
              >
                {!seller?.isDeleted ? "Confirm Delete" : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
