import { useRouter } from "next/navigation";
import useUser from "./useUser";
import { useEffect } from "react";

export default function useRequireAuth() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}
