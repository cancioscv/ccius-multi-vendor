import axiosInstance from "@/utils/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href: string;
}
export default function SidebarItem({ title, icon, isActive, href }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function logout() {
    try {
      await axiosInstance.get("/api/logout-admin");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  function handleClick(e: React.MouseEvent) {
    if (title === "Logout") {
      e.preventDefault();
      logout();
    }
  }

  return (
    <Link href={href} onClick={handleClick} className="my-2 block">
      <div
        className={`flex gap-2 w-full min-h-12 h-full items-center px-[13px] rounded-lg cursor-pointer transition hover:bg-[#2b2f31] ${
          isActive && "scale-[.98] bg-[#0f3158] fill-blue-200 hover:!bg-[#0f3158d6]"
        }`}
      >
        {icon}
        <h5 className="text-slate-200 text-lg">{title}</h5>
      </div>
    </Link>
  );
}
