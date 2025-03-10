import { usePathname } from "next/navigation";

export function ConditionalRender({
  children,
  pathName,
}: {
  children: React.ReactNode;
  pathName: string;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes(pathName);
  return <>{isLoginPage ? children : null}</>;
}
