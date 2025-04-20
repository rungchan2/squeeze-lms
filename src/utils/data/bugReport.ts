import { CreateBugReport } from "@/types";
import { createClient } from "@/utils/supabase/client";

export async function createBugReport(bugReport: CreateBugReport) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bug_reports")
      .insert(bugReport)
      .single();
    return { data, error };
  }