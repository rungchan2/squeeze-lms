import { createClient } from "@/utils/supabase/client";
const supabase = createClient();

export const auth = {
    getUser: async () => {
        const { data, error } = await supabase.auth.getUser();
        return {data, error};
    },
    userLogout: async () => {
        const { error } = await supabase.auth.signOut();
        return error;
    }
}
