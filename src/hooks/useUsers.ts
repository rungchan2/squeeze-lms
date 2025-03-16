import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@/types";
export function useUsers(id: number) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
      setUser(data as User);
    };
    fetchUser();
  }, [id]);
  return user;
}
