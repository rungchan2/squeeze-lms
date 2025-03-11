"use client";

import { logout } from "@/app/(auth)/actions";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AuthCodeError() {
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get('error');
  const error_description = params.get('error_description');

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };
  return <div>
    <h1>Auth Code Error</h1>
    <p>Something went wrong. Please try again.</p>
    <p>{error}</p>
    <p>{error_description}</p>

    <button style={{ marginTop: '10px', color: 'var(--primary-500)' }} onClick={handleLogout}>Logout</button>
  </div>
}
