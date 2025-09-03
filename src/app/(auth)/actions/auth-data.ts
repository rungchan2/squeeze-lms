"use server";

import { cookies } from "next/headers";
import { decrypt } from "@/utils/encryption";
import { NeededUserMetadata } from "../auth/callback/route";

export async function getAuthDataFromCookie(): Promise<{
  data: NeededUserMetadata | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const encryptedData = cookieStore.get("auth_data");

    if (!encryptedData?.value) {
      return { data: null, error: "No auth data found" };
    }

    try {
      const decryptedString = decrypt(encryptedData.value);
      if (!decryptedString) {
        return { data: null, error: "Failed to decrypt auth data" };
      }

      const authData: NeededUserMetadata = JSON.parse(decryptedString);
      return { data: authData, error: null };
    } catch (error) {
      console.error("Decryption error:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : "Decryption failed" 
      };
    }
  } catch (error) {
    console.error("Cookie reading error:", error);
    return { 
      data: null, 
      error: "Failed to read authentication data" 
    };
  }
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth_data");
}