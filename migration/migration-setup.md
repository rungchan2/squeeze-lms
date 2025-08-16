⚠️ 잠재적 충돌 영역과 해결 방법
1. CSS Reset/Normalize 충돌
두 시스템 모두 기본 스타일을 리셋합니다:
css/* globals.css - Tailwind base를 조건부로 적용 */
@layer base {
  /* Chakra UI가 적용되지 않은 요소에만 Tailwind reset 적용 */
  :where(:not([data-chakra-ui])) {
    @tailwind base;
  }
}

@tailwind components;
@tailwind utilities;
2. 클래스명 충돌
tsx// 안전한 방법: 명시적으로 구분
<div className="flex gap-4"> {/* Tailwind */}
  <ChakraButton colorScheme="blue">Chakra Button</ChakraButton>
  <Button className="bg-blue-500">ShadCN Button</Button>
</div>
3. Provider 설정
tsx// app/providers.tsx
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider resetCSS={false}> {/* resetCSS를 false로 설정 */}
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
      >
        {children}
      </NextThemesProvider>
    </ChakraProvider>
  );
}
🛠 안전한 마이그레이션 전략
1. 네이밍 컨벤션으로 구분
tsx// Chakra UI 컴포넌트는 별칭 사용
import { Button as ChakraButton } from '@chakra-ui/react';
import { Button } from '@/components/ui/button'; // ShadCN

// 사용 시 명확히 구분
<ChakraButton>Old Button</ChakraButton>
<Button>New Button</Button>
2. 점진적 교체를 위한 래퍼 컴포넌트
tsx// components/migration/Button.tsx
import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import { Button as ShadButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonProps extends ChakraButtonProps {
  useShadcn?: boolean;
}

export const Button = ({ useShadcn = false, ...props }: ButtonProps) => {
  if (useShadcn) {
    // Chakra props를 ShadCN props로 변환
    const { colorScheme, size, variant, ...rest } = props;
    return (
      <ShadButton
        variant={variant as any}
        size={size as any}
        className={cn(
          colorScheme === 'blue' && 'bg-blue-500 hover:bg-blue-600',
          // 다른 매핑들...
        )}
        {...rest}
      />
    );
  }
  
  return <ChakraButton {...props} />;
};
3. Feature Flag 활용
tsx// config/features.ts
export const featureFlags = {
  useShadcnButton: process.env.NEXT_PUBLIC_USE_SHADCN_BUTTON === 'true',
  useShadcnForm: process.env.NEXT_PUBLIC_USE_SHADCN_FORM === 'true',
  // ...
};

// 컴포넌트에서 사용
import { featureFlags } from '@/config/features';

export const MyComponent = () => {
  return (
    <>
      {featureFlags.useShadcnButton ? (
        <Button>ShadCN Button</Button>
      ) : (
        <ChakraButton>Chakra Button</ChakraButton>
      )}
    </>
  );
};
📦 설치 순서 권장사항
bash# 1. Tailwind CSS 먼저 설치
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 2. tailwind.config.js 설정
# important: true 옵션으로 우선순위 확보 가능
module.exports = {
  important: '#app', // 특정 컨테이너 내에서만 우선순위
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ...
}

# 3. ShadCN 설치
npx shadcn-ui@latest init

# 4. 컴포넌트 개별 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
# ...
🔍 충돌 디버깅 팁
1. 스타일 우선순위 확인
tsx// 개발자 도구에서 확인할 수 있는 data 속성 추가
<div data-styling="tailwind" className="p-4">
  <div data-styling="chakra">
    <Box p={4}>
      {/* 어떤 스타일이 적용되는지 확인 */}
    </Box>
  </div>
</div>
2. CSS 변수 충돌 방지
css/* Chakra UI와 ShadCN의 CSS 변수 네임스페이스 분리 */
:root {
  /* ShadCN 변수는 --sh- 접두사 */
  --sh-primary: 220 90% 56%;
  
  /* Chakra는 기본 변수 유지 */
  --chakra-colors-blue-500: #3182ce;
}
✨ 실전 예시
tsx// pages/migration-test.tsx
import { Box, Button as ChakraButton } from '@chakra-ui/react';
import { Button } from '@/components/ui/button';

export default function MigrationTest() {
  return (
    <div className="p-8 space-y-4">
      {/* Tailwind 컨테이너 */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">ShadCN Components</h2>
        <Button variant="default">ShadCN Button</Button>
      </div>
      
      {/* Chakra UI 컨테이너 */}
      <Box border="1px" borderColor="gray.200" rounded="lg" p={4}>
        <ChakraButton colorScheme="blue">Chakra Button</ChakraButton>
      </Box>
    </div>
  );
}