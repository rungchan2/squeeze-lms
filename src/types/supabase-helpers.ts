// Type helper to handle Supabase query results with potential errors
export type SafeSupabaseResult<T> = T | any;

// Type guard to check if a result is valid data (not an error)
export function isValidData<T>(data: any): data is T {
  return data && !data.error;
}

// Type guard for arrays
export function isValidDataArray<T>(data: any): data is T[] {
  return Array.isArray(data) && data.every(item => !item.error);
}

// Helper to safely access properties
export function safeAccess<T, K extends keyof T>(
  data: SafeSupabaseResult<T>,
  key: K
): T[K] | undefined {
  if (isValidData<T>(data)) {
    return data[key];
  }
  return undefined;
}

// Helper to cast data safely
export function safeCast<T>(data: any): T {
  return data as T;
}