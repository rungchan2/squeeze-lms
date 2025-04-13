import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toaster } from "../ui/toaster";
import { Role } from "@/types";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
interface ForbiddenProps {
  requiredRole: Role[];
}

export default function Forbidden({ requiredRole }: ForbiddenProps) {
  const router = useRouter();
  const { role } = useSupabaseAuth();

  useEffect(() => {
    if (!requiredRole.includes(role as Role)) {
      toaster.create({
        title: "해당 페이지에 접근할 수 없습니다.",
        type: "error",
      });
      router.back();
    }
  }, [role, router, requiredRole]);
  
  return null;
}