import React from "react";
import styled from "@emotion/styled";

type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5;
  children: React.ReactNode;
  className?: string;
  color?: string;
};

const Heading = ({ level = 1, children, className, color }: HeadingProps) => {
  switch (level) {
    case 1:
      return <H1 className={className} color={color}>{children}</H1>;
    case 2:
      return <H2 className={className} color={color}>{children}</H2>;
    case 3:
      return <H3 className={className} color={color}>{children}</H3>;
    case 4:
      return <H4 className={className} color={color}>{children}</H4>;
    case 5:
      return <H5 className={className} color={color}>{children}</H5>;
    default:
      return <H1 className={className} color={color}>{children}</H1>;
  }
};

export default Heading;

const H1 = styled.h1`
  font-family: "Inter", sans-serif;
  font-size: 40px;
  line-height: 80px;
  font-weight: bold;
  color: ${({ color }) => color || "inherit"};
`;

const H2 = styled.h2`
  font-family: "Inter", sans-serif;
  font-size: 32px;
  line-height: 64px;
  font-weight: 600; /* Semi Bold */
  color: ${({ color }) => color || "inherit"};
`;

const H3 = styled.h3`
  font-family: "Inter", sans-serif;
  font-size: 24px;
  line-height: 48px;
  font-weight: 600; /* Semi Bold */
  color: ${({ color }) => color || "inherit"};
`;

const H4 = styled.h4`
  font-family: "Inter", sans-serif;
  font-size: 20px;
  line-height: 40px;
  font-weight: 600; /* Semi Bold */
  color: ${({ color }) => color || "inherit"};
`;

const H5 = styled.h5`
  font-family: "Inter", sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600; /* Semi Bold */
  color: ${({ color }) => color || "inherit"};
`;