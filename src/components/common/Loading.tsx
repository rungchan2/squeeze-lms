import { Skeleton, SkeletonText } from "@chakra-ui/react";

export function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "10px",
        gap: "10px",
      }}
    >
      <SkeletonText />
      <Skeleton height="100px" />
    </div>
  );
}
