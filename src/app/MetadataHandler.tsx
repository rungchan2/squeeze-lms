'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function MetadataHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const prevTabRef = useRef<string | null>(null);
  
  useEffect(() => {
    const tabValue = searchParams.get('tab');
    const tab = tabValue || "홈";
    
    // 이전과 같은 탭이면 업데이트 생략
    if (prevTabRef.current === tab) return;
    prevTabRef.current = tab;
    
    // requestAnimationFrame을 사용하여 브라우저 렌더링 싸이클에 맞춰 실행
    requestAnimationFrame(() => {
      // 메타데이터 업데이트 (제목 변경)
      document.title = `스퀴즈! ${tab}`;
      
      // OpenGraph 메타 태그 업데이트 (필요한 경우만)
      updateMetaTag('og:title', `스퀴즈! ${tab}`);
      updateMetaTag('og:url', `${window.location.origin}${pathname}${window.location.search}`);
    });
  }, [searchParams, pathname]);
  
  // 메타 태그 효율적 업데이트 함수
  const updateMetaTag = (property: string, content: string) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`);
    
    // 태그가 없으면 생성
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      document.head.appendChild(metaTag);
    }
    
    // 내용이 다른 경우만 업데이트
    if (metaTag.getAttribute('content') !== content) {
      metaTag.setAttribute('content', content);
    }
  };

  return null;
} 