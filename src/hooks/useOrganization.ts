import { useEffect, useState } from "react";
import { Organization } from "@/types";
import { createClient } from "@/utils/supabase/client";

export function useOrganization(id: number) {
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    if (id === 0) {
      setOrganization(null);
      return;
    }
    
    const fetchOrganization = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("organizations").select("*").eq("id", id).single();
      setOrganization(data as Organization);
    };
    fetchOrganization();
  }, [id]);
  
  return organization;
}