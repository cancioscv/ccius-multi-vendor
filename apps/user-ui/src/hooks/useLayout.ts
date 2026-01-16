import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

async function fetchLayout() {
  const res = await axiosInstance.get("/auth/api/get-layouts");
  return res.data.layout;
}

export default function useLayout() {
  const {
    data: layout,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["layout"],
    queryFn: fetchLayout,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  return { layout, isLoading, isError, refetch };
}
