import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
async function fetchAdmin() {
  const response = await axiosInstance.get("/api/logged-admin");
  return response.data.user;
}

export default function useAdmin() {
  const router = useRouter();

  const {
    data: admin,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin"],
    queryFn: fetchAdmin,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/");
    }
  }, [admin, isLoading]);

  return { admin, isLoading, isError, refetch };
}
