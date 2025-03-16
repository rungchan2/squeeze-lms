import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Role } from "@/types";

export function useRole(requiredRole: Role) {
  const { role, isAuthenticated, loading } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!loading && isAuthenticated && role !== requiredRole) {
      router.push("/login");
    }
  }, [role, isAuthenticated, loading, router]);

  return { role, isAuthenticated, loading };
}
