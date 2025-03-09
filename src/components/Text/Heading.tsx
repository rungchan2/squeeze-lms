import React from "react";
import styled from "@emotion/styled";

type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5;
  children: React.ReactNode;
  className?: string;
  color?: string;
  weight?: string;
};

export default function Heading({
  level = 1,
  children,
  className,
  color,
  weight,
}: HeadingProps) {
  switch (level) {
    case 1:
      return <H1 className={className} color={color} weight={weight}>{children}</H1>;
    case 2:
      return <H2 className={className} color={color} weight={weight}>{children}</H2>;
    case 3:
      return <H3 className={className} color={color} weight={weight}>{children}</H3>;
    case 4:
      return <H4 className={className} color={color} weight={weight}>{children}</H4>;
    case 5:
      return <H5 className={className} color={color} weight={weight}>{children}</H5>;
    default:
      return <H1 className={className} color={color} weight={weight}>{children}</H1>;
  }
};

const H1 = styled.h1<{ color?: string; weight?: string }>`
  font-family: "Inter", sans-serif;
  font-size: 40px;
  font-weight: ${({ weight }) => weight || "bold"};
  color: ${({ color }) => color || "inherit"};
`;

const H2 = styled.h2<{ color?: string; weight?: string }>`
  font-family: "Inter", sans-serif;
  font-size: 32px;
  font-weight: ${({ weight }) => weight || "600"}; /* Semi Bold */
  color: ${({ color }) => color || "inherit"};
`;

const H3 = styled.h3<{ color?: string; weight?: string }>`
  font-family: "Inter", sans-serif;
  font-size: 24px;
  font-weight: ${({ weight }) => weight || "600"}; /* Semi Bold */
  color: ${({ color }) => color || "inherit"};
`;

const H4 = styled.h4<{ color?: string; weight?: string }>`
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: ${({ weight }) => weight || "600"}; /* Semi Bold */
  color: ${({ color }) => color || "inherit"};
`;

const H5 = styled.h5<{ color?: string; weight?: string }>`
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: ${({ weight }) => weight || "600"}; /* Semi Bold */
  color: ${({ color }) => color || "inherit"};
`;