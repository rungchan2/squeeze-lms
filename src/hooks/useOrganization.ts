import { useEffect, useState } from "react";
import { Organization } from "@/types/organizations";
import { supabase } from "@/utils/supabase/client";

export function useOrganization(id: number) {
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    if (id === 0) {
      setOrganization(null);
      return;
    }
    
    const fetchOrganization = async () => {
      const { data } = await supabase.from("organizations").select("*").eq("id", id).single();
      setOrganization(data as Organization);
    };
    fetchOrganization();
  }, [id]);
  
  return organization;
}