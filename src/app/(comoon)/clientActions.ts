import { createClient } from "@/utils/supabase/client";
import { CreateBugReport } from "@/types/bugReports";

export async function createBugReport(bugReport: CreateBugReport) {
  const supabase = createClient();
  const { data, error } = await supabase.from("bug_reports").insert(bugReport).single();
  return { data, error };
}