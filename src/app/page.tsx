"use client";

import HomeTab from "./(home)/HomeTab";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { User } from "@/types/users";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export default function Home() {
  const { role, isAuthenticated, firstName, lastName, organizationId } = useSupabaseAuth();
  console.log("useSupabaseAuth",role);
  console.log("useSupabaseAuth",isAuthenticated);
  console.log("useSupabaseAuth",firstName);
  console.log("useSupabaseAuth",lastName);
  console.log("useSupabaseAuth",organizationId);
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      const { data: session } = await supabase.auth.getSession();
      console.log("getUser",data, error);
      console.log("getSession",session);
    };
    getUser();
  }, []);
  return (
    <div>
      <p>{role}</p>
      <p>{isAuthenticated}</p>
    </div>
  );
}
