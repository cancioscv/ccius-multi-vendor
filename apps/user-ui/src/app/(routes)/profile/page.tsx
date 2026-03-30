"use client";

import useRequireAuth from "@/hooks/useRequireAuth";
import QuickActionCard from "@/shared/components/cards/quick-action-card";
import StatCard from "@/shared/components/cards/stat-card";
import ChangePassword from "@/shared/components/change-password";
import OrdersTable from "@/shared/components/orders-table";
import ShippingAddress from "@/shared/components/shipping-address";
import NavItem from "@/shared/widgets/nav-item";
import axiosInstance from "@/utils/axiosInstance";
import { cn } from "@e-com/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, isLoading } = useRequireAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const queryTab = searchParams.get("active") || "Profile";
  const [activeTab, setActiveTab] = useState(queryTab);

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
    await axiosInstance.get("/api/logout-user").then((res) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });

      router.push("/login");
    });
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

  return (
    <div className="bg-gray-50 p-6 pb-14">
      <div className="md:max-w-7xl mx-auto">
        {/* Gretting */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back,{" "}
            <span className="text-blue-600">{isLoading ? <Loader2 className="inline animate-spin w-5 h-5" /> : `${user?.name || "User"}`}</span> 👋
          </h1>
        </div>

        {/* Profile Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard title="Total Orders" count={totalOrders} icon={Clock} />
          <StatCard title="Processing Orders" count={processingOrders} icon={Truck} />
          <StatCard title="Completed Orders" count={completedOrders} icon={CheckCircle} />
        </div>

        {/* sidebar and content Layout */}
        <div className="mt-10 flex flex-col md:flex-row gap-6">
          {/* Left Navigation */}
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 w-full md:w-1/5">
            <nav className="space-y-2">
              <NavItem label="Profile" icon={User} active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
              <NavItem label="My Orders" icon={ShoppingBag} active={activeTab === "My Orders"} onClick={() => setActiveTab("My Orders")} />
              <NavItem label="Inbox" icon={Inbox} active={activeTab === "Inbox"} onClick={() => router.push("/inbox")} />
              <NavItem label="Notifications" icon={Bell} active={activeTab === "Notifications"} onClick={() => setActiveTab("Notifications")} />
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
          <div className={cn(`bg-white p-6 rounded-md shadow-sm border border-gray-100 w-full `, activeTab !== "My Orders" && "md:w-[55%]")}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{activeTab}</h2>
            {activeTab === "Profile" && !isLoading && user ? (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <Image
                    src={user?.avatar || "/placeholder.png"}
                    alt="profile"
                    width={60}
                    height={60}
                    className="w-16 h-16 rounded-full border border-gray-200"
                  />
                  <button className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                    <Pencil className="w-4 h-4" /> Change Photo
                  </button>
                </div>
                <p>
                  <span className="font-semibold">Name:</span> {user.name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            ) : activeTab === "Shipping Address" ? (
              <ShippingAddress />
            ) : activeTab === "My Orders" ? (
              <OrdersTable />
            ) : activeTab === "Change Password" ? (
              <ChangePassword />
            ) : activeTab === "Notifications" ? (
              <div className="space-y-4 text-sm text-gray-700">
                {!isLoadingNotifications && notifications?.length === 0 && <p>No Notifications available yet!</p>}

                {!isLoadingNotifications && notifications?.length > 0 && (
                  <div className="md:w-[80%] my-6 rounded-lg divide-y divide-gray-800 bg-black/40 backdrop-blur-lg shadow-sm">
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
            ) : (
              <p>Not Found</p>
            )}
          </div>

          {/* Right Quick Panel */}
          {activeTab !== "My Orders" && (
            <div className="w-full md:w-1/4 space-y-4">
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
