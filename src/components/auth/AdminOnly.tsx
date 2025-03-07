import { useAuthStore } from "@/store/auth";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || role !== "admin") {
    return null;
  }

  return <>{children}</>;
}