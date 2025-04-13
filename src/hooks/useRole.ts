import { useRouter } from "next/router";
import { useEffect } from "react";
import { Role } from "@/types";
import { useSupabaseAuth } from "./useSupabaseAuth";
export function useRole(requiredRole: Role) {
  const { role, isAuthenticated, loading } = useSupabaseAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && isAuthenticated && role !== requiredRole) {
      router.push("/login");
    }
  }, [role, isAuthenticated, loading, router, requiredRole]);

  return { role, isAuthenticated, loading };
}
