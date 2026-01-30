import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { useAuthStore } from "@/store/authStore";
import { isProtected } from "@/utils/protected";
import { useEffect } from "react";

// TODO: fix this loggin issue
async function fetchUser(isLoggedIn: boolean) {
  const config = isLoggedIn ? isProtected : {};
  const response = await axiosInstance.get("/api/logged-user", config);
  return response?.data?.user;
}

export default function useUser() {
  const { isLoggedIn, setLoggedIn } = useAuthStore();
  const {
    data: user,
    isPending: isLoading,
    isError,
    // refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: () => fetchUser(isLoggedIn),
    staleTime: 1000 * 60 * 5, // Date is fresh for 5 mins
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
