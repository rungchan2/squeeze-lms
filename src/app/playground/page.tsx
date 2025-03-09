

import { supabase } from "@/utils/supabase/client";

export default async function PlaygroundPage() {
  const { data, error } = await supabase.auth.getUser();
  console.log(data, error);

  return (
    <div>
      <h1>Playground</h1>
      <p>data</p>
    </div>
  );    
}
