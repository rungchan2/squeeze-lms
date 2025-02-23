import { supabase } from "@/lib/initSupabase";

export default async function AdminPage() {
  const { data, error } = await supabase.from("users").select("*");
  console.log(data);

  return (
    <div>
      Admin Page
      {data?.map((user) => (
        <div key={user.id}>
          {user.first_name} {user.last_name}
        </div>
      ))}
    </div>
  );
}
