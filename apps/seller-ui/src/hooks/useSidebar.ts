"use client";

import { useAtom } from "jotai";
import { activeSidebarItem } from "../configs/constants";
export default function useSidebar() {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSidebarItem);
  return {
    activeSidebar,
    setActiveSidebar,
  };
}
