import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { useAuthStore } from "@/store/authStore";
import { isProtected } from "@/utils/protected";
import { useEffect } from "react";

async function fetchUser() {
  const response = await axiosInstance.get("/api/logged-user", isProtected);
  return response?.data?.user;
}

export default function useUser() {
  const { isLoggedIn, setLoggedIn } = useAuthStore();
  const {
    data: user,
    isLoading,
    isError,
    // refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: isLoggedIn,
  });

  // Update auth state based on query results
  useEffect(() => {
    if (user) {
      setLoggedIn(true);
    } else if (isError) {
      setLoggedIn(false);
    }
  }, [user, isLoggedIn, isError]);

  return { user, isLoading, isError };
}
