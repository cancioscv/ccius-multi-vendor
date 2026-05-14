"use client";

import useRequireAuth from "@/hooks/useRequireAuth";
import QuickActionCard from "@/shared/components/cards/quick-action-card";
import StatCard from "@/shared/components/cards/stat-card";
import ChangePassword from "@/shared/components/change-password";
import OrdersTable from "@/shared/components/orders-table";
import ShippingAddress from "@/shared/components/shipping-address";
import NavItem from "@/shared/widgets/nav-item";
import { useAuthStore } from "@/store/authStore";
import axiosInstance from "@/utils/axiosInstance";
import { cn } from "@e-com/ui";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
  X,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Helper: get initials from full name
function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfilePage() {
  const { user, isLoading } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const queryTab = searchParams.get("active") || "Profile";
  const [activeTab, setActiveTab] = useState(queryTab);
  const [isEditing, setIsEditing] = useState(false);

  const { setLoggedIn } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email });
    }
  }, [user, reset]);

  const { mutate: updateProfile } = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const res = await axiosInstance.put(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/update-profile`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setIsEditing(false);
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/user-orders`);
      return res.data.orders;
    },
    refetchOnMount: "always", // TODO: This is a temporary fix for SEPA
    structuralSharing: false, // TODO: This is a temporary fix for SEPA
  });

  const totalOrders = orders.length;

  const processingOrders = orders.filter((order: any) => order?.deliveryStatus !== "DELIVERED" && order?.deliveryStatus !== "CANCELLED").length;
  const completedOrders = orders.filter((order: any) => order?.deliveryStatus === "DELIVERED").length;

  async function logout() {
    await axiosInstance.get("/api/logout-user");

    setLoggedIn(false); // ✅ disables the query
    queryClient.removeQueries({ queryKey: ["user"] }); // ✅ clears cached user data
    queryClient.removeQueries({ queryKey: ["shipping-addresses"] });

    router.push("/login");
  }

  const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/api/user-notifications");
      return res.data.notifications;
    },
  });

  async function markAsRead(notificationId: string) {
    await axiosInstance.post("/seller/api/mark-notification-as-read", {
      notificationId,
    });
  }

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("active", activeTab);
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  const onSubmitProfile = (data: any) => {
    updateProfile({ name: data.name, email: data.email });
  };

  return (
    <div className="bg-[#f5f5f0] min-h-screen py-6 pb-14">
      <div className="mx-auto">
        {/* Greeting Banner */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-8 mb-8 px-4">
          <p className="text-sm text-gray-500 mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold text-gray-900">
            Hello, <span className="text-[#e07b39]">{isLoading ? <Loader2 className="inline animate-spin w-5 h-5" /> : user?.name || "User"}</span> 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage your orders, profile, and preferences from one place.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard title="TOTAL ORDERS" count={totalOrders} icon={Clock} color="orange" />
          <StatCard title="PROCESSING" count={processingOrders} icon={Truck} color="blue" />
          <StatCard title="COMPLETED" count={completedOrders} icon={CheckCircle} color="green" />
        </div>

        {/* Sidebar + Main + Right Panel */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 w-full md:w-56 flex-shrink-0">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-5 px-1">
              <div className="w-10 h-10 rounded-full bg-[#e07b39] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {isLoading ? "..." : getInitials(user?.name || "User")}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              <NavItem label="Profile" icon={User} active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
              <NavItem label="My Orders" icon={ShoppingBag} active={activeTab === "My Orders"} onClick={() => setActiveTab("My Orders")} />
              <NavItem label="Inbox" icon={Inbox} active={activeTab === "Inbox"} onClick={() => router.push("/inbox")} badge={2} />
              <NavItem
                label="Notifications"
                icon={Bell}
                active={activeTab === "Notifications"}
                onClick={() => setActiveTab("Notifications")}
                badge={5}
              />
              <NavItem
                label="Shipping Address"
                icon={MapPin}
                active={activeTab === "Shipping Address"}
                onClick={() => setActiveTab("Shipping Address")}
              />
              <NavItem label="Change Password" icon={Lock} active={activeTab === "Change Password"} onClick={() => setActiveTab("Change Password")} />
              <NavItem label="Logout" icon={LogOut} danger onClick={() => logout()} />
            </nav>
          </div>

          {/* Main Content */}
          <div
            className={cn("bg-white rounded-xl border border-gray-100 shadow-sm p-6 w-full", activeTab !== "My Orders" ? "md:flex-1" : "md:flex-1")}
          >
            {/* Profile Tab */}
            {activeTab === "Profile" && !isLoading && user ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Profile</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Update your personal information and how others see you.</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        reset({ name: user.name, email: user.email });
                      }}
                      className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>

                {/* Avatar */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#e07b39] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {getInitials(user?.name || "User")}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG or PNG, max 2MB</p>
                    {/* Photo upload is intentionally disabled for now */}
                    {/* <button className="text-xs text-[#e07b39] mt-1 font-medium hover:underline">
                      Change photo
                    </button> */}
                  </div>
                </div>

                {/* Form / Info Grid */}
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Full name</label>
                        <input
                          type="text"
                          {...register("name", { required: "Name is required" })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#e07b39] transition"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                        <input
                          type="email"
                          {...register("email", { required: "Email is required" })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#e07b39] transition"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-[#e07b39] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#c96a2a] transition"
                      >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Full name</label>
                      <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-gray-50">{user.name}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                      <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-gray-50 flex items-center gap-2">
                        <span className="text-gray-400">✉</span> {user.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Member since</label>
                      <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-gray-50 flex items-center gap-2">
                        <span className="text-gray-400">📅</span> {new Date(user.createdAt).toLocaleDateString("en-GB")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === "Shipping Address" ? (
              <ShippingAddress />
            ) : activeTab === "My Orders" ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Track, review, and manage all your purchases.</p>
                </div>
                <OrdersTable />
              </div>
            ) : activeTab === "Change Password" ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Change Password
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">Use a strong password you don't reuse anywhere else.</p>
                </div>
                <ChangePassword />
              </div>
            ) : activeTab === "Notifications" ? (
              <div>
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  {!isLoadingNotifications && notifications?.length === 0 && <p className="text-gray-500">No notifications available yet!</p>}

                  {!isLoadingNotifications && notifications?.length > 0 && (
                    <div className="rounded-xl divide-y divide-gray-800 bg-black/40 backdrop-blur-lg shadow-sm">
                      {notifications.map((notification: any) => (
                        <Link
                          key={notification.id}
                          href={`${notification.redirectLink}`}
                          className={`block px-5 py-4 transition ${
                            notification.status !== "Unread" ? "hover:bg-gray-800/40" : "bg-gray-800/50 hover:bg-gray-800/70"
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{notification.title}</span>
                              <span className="text-gray-300 text-sm">{notification.message}</span>
                              <span className="text-gray-500 text-xs mt-1">
                                {new Date(notification.createdAt).toLocaleString("en-UK", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Not Found</p>
            )}
          </div>

          {/* Right Quick Panel — hidden on My Orders tab */}
          {activeTab !== "My Orders" && (
            <div className="w-full md:w-60 flex-shrink-0 space-y-3">
              <QuickActionCard icon={Gift} title="Referral Program" description="Invite friends and earn rewards." />
              <QuickActionCard icon={BadgeCheck} title="Your Badges" description="View your earned achievements." />
              <QuickActionCard icon={Settings} title="Account Settings" description="Manage preferences and security." />
              <QuickActionCard icon={Receipt} title="Billing History" description="Check your recent payments." />
              <QuickActionCard icon={PhoneCall} title="Support Center" description="Need help? Contact support." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
