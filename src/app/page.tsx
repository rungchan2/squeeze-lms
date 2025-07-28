"use client";

import { Suspense } from "react";
import HomeTab from "./(home)/HomeTab";
import { Loading } from "@/components/common/Loading";

export default function Home() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <HomeTab />
      </Suspense>
    </div>
  );
}
