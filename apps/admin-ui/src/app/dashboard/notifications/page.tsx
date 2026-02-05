"use client";

import Breadcrumbs from "@/shared/components/breadcrumbs";
import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function Notifications() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/api/all-notifications");
      return res.data.notifications;
    },
  });

  async function markAsRead(notificationId: string) {
    await axiosInstance.post("/seller/api/mark-notification-as-read", {
      notificationId,
    });
  }
  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Notifications</h2>
      {/* Breadcrumbs */}
      <Breadcrumbs title="Notifications" />

      {!isLoading && data?.length === 0 && <p className="text-center pt-24 text-white text-sm font-Poppins">No Notifications available yet!</p>}

      {!isLoading && data?.length > 0 && (
        <div className="md:w-[80%] my-6 rounded-lg divide-y divide-gray-800 bg-black/40 backdrop-blur-lg shadow-sm">
          {data.map((d: any) => (
            <Link
              key={d.id}
              href={`${d.redirectLink}`}
              className={`block px-5 py-4 transition ${d.status !== "UNREAD" ? "hover:bg-gray-800/40" : "bg-gray-800/50 hover:bg-gray-800/70"}`}
              onClick={() => markAsRead(d.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col">
                  <span className="text-white font-medium">{d.title}</span>
                  <span className="text-gray-300 text-sm">{d.message}</span>
                  <span className="text-gray-500 text-xs mt-1">
                    {new Date(d.createdAt).toLocaleString("en-UK", {
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
  );
}
