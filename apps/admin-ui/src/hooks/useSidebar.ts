import { activeSideBarItem } from "@/configs/constants";
import { useAtom } from "jotai";

export default function useSidebar() {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSideBarItem);

  return { activeSidebar, setActiveSidebar };
}
