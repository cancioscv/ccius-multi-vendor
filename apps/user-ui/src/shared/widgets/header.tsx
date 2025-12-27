"use client";

import { HeartIcon, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import HeaderBottom from "./header-bottom";
import useUser from "@/hooks/useUser";

export default function Header() {
  const { user, isLoading } = useUser();
  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 m-auto flex items-center justify-between">
        <div>
          <Link href="/">
            <span className="text-3xl font-[500]">Ccius</span>
          </Link>
        </div>
        <div className="w-[50%] relative">
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full px-4 font-Poppins font-medium border-[2.5px] border-gray-500 outline-none h-[55px]"
          />
          <div className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-gray-500 absolute top-0 right-0">
            <Search className="h-4 w-4" color="white" />
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            {user && !isLoading ? (
              <>
                <Link href="/profile" className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]">
                  <User />
                </Link>
                <Link href="/profile">
                  <span className="block font-medium">Hello, </span>
                  <span className="font-semibold">{user.name.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]">
                  <User />
                </Link>

                <Link href="/login">
                  <span className="block font-medium">Hello, </span>
                  <span className="font-semibold">{isLoading ? "..." : "Sign In"}</span>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <Link href="/wishlist" className="relative">
              <HeartIcon />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm">0</span>
              </div>
            </Link>
            <Link href="/cart" className="relative">
              <ShoppingCart />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm">0</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="border-b border-gray-300" />
      <HeaderBottom />
    </div>
  );
}
