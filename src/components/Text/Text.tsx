import React from "react";
import styled from "@emotion/styled";

type TextProps = {
  variant?: "body" | "caption" | "small";
  children: React.ReactNode;
  className?: string;
  color?: string;
};

const Text = ({ variant = "body", children, className, color }: TextProps) => {
  switch (variant) {
    case "body":
      return <BodyText className={className} color={color}>{children}</BodyText>;
    case "caption":
      return <CaptionText className={className} color={color}>{children}</CaptionText>;
    case "small":
      return <SmallText className={className} color={color}>{children}</SmallText>;
    default:
      return <BodyText className={className} color={color}>{children}</BodyText>;
  }
};

export default Text;

const BodyText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 16px;
  line-height: 32px;
  font-weight: 400; /* Regular */
  color: ${({ color }) => color || "inherit"};
`;

const CaptionText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 28px;
  font-weight: 500; /* Medium */
  color: ${({ color }) => color || "inherit"};

`;

const SmallText = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 10px;
  line-height: 20px;
  font-weight: 400; /* Regular */
  color: ${({ color }) => color || "inherit"};

`;