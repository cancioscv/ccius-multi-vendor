import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";

async function fetchUser() {
  const response = await axiosInstance.get("/api/logged-user");
  return response?.data?.user;
}

export default function useUser() {
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return { user, isLoading, isError, refetch };
}
