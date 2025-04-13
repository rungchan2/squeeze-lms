import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated } = useSupabaseAuth();
  if (!isAuthenticated || role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
export function TeacherOnly({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated } = useSupabaseAuth();
  if (!isAuthenticated || (role !== "teacher" && role !== "admin")) {
    return null;
  }

  return <>{children}</>;
}