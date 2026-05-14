"use client";

import axiosInstance from "@/utils/axiosInstance";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function ChangePassword() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async (data: any) => {
    setError("");
    setMessage("");
    try {
      await axiosInstance.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data?.confirmPassword,
      });
      setMessage("Password updated successfully!");
      reset();
    } catch (error: any) {
      setError(error?.response?.data?.message);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#e07b39] pr-10 transition";

  return (
    <div className="max-w-md space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Current password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              {...register("currentPassword", {
                required: "Current password is required",
                minLength: { value: 6, message: "Minimum 6 characters" },
              })}
              className={inputClass}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword?.message && <p className="text-red-500 text-xs mt-1">{String(errors.currentPassword.message)}</p>}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">New password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              {...register("newPassword", {
                required: "New password is required",
                minLength: { value: 8, message: "Must be at least 8 characters" },
                validate: {
                  hasLower: (v) => /[a-z]/.test(v) || "Must include a lowercase letter",
                  hasUpper: (v) => /[A-Z]/.test(v) || "Must include an uppercase letter",
                  hasNumber: (v) => /\d/.test(v) || "Must include a number",
                },
              })}
              className={inputClass}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword?.message && <p className="text-red-500 text-xs mt-1">{String(errors.newPassword.message)}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm new password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (v) => v === watch("newPassword") || "Passwords do not match",
              })}
              className={inputClass}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword?.message && <p className="text-red-500 text-xs mt-1">{String(errors.confirmPassword.message)}</p>}
        </div>

        {/* Hint */}
        <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Password must be at least 8 characters and contain a number and a symbol.</span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#e07b39] text-white text-sm px-6 py-2.5 rounded-xl hover:bg-[#c96a2a] transition font-medium"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="text-sm text-gray-500 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>

      {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}
      {message && <p className="text-green-600 text-sm bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">{message}</p>}
    </div>
  );
}
