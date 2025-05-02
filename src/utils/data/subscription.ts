import { createClient } from "../supabase/client";

export interface Subscription {
  id: string;
  user_id: string;
  notification_json: string;
  created_at: string | null;
}

export async function getSubscription(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  
  return data;
};

export async function getSubscriptionById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createSubscription(userId: string, notificationJson: string) {
  const supabase = createClient();
  
  // 기존 구독 있으면 삭제
  await deleteSubscription(userId);
  
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ 
      user_id: userId, 
      notification_json: notificationJson 
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function deleteSubscription(userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}