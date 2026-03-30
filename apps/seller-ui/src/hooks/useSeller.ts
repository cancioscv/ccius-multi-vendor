import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { isProtected } from "@/utils/protected";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";

async function fetchSeller() {
  const response = await axiosInstance.get("/api/logged-seller", isProtected);
  return response.data.seller;
}

export default function useSeller() {
  const { isLoggedIn, setLoggedIn } = useAuthStore();
  const {
    data: seller,
    isPending: isLoading,
    isError,
  } = useQuery({
    queryKey: ["seller"],
    queryFn: fetchSeller,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Update auth state based on query results
  useEffect(() => {
    if (seller) {
      setLoggedIn(true);
    } else if (isError) {
      setLoggedIn(false);
    }
  }, [seller, isLoggedIn, isError]);

  return { seller, isLoading, isError };
}
