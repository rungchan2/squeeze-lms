'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';

export function ClientNavigation() {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');
  
  if (isLoginPage) {
    return null;
  }
  
  return <Navigation />;
} 