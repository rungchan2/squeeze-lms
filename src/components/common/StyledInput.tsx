import { Box, Field, Input, defineStyle } from "@chakra-ui/react";
import { InputHTMLAttributes } from "react";
export default function StyledInput(
  props: InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean;
    label?: string;
    size?: "sm" | "md" | "lg" | "xl" | "2xl" | "2xs" | "xs";
  }
) {
  return (
    <Field.Root>
      <Box pos="relative" w="full">
        <Input className="peer" placeholder="" {...props} />
        <Field.Label css={floatingStyles}>{props.label}</Field.Label>
      </Box>
    </Field.Root>
  );
}

const floatingStyles = defineStyle({
  pos: "absolute",
  bg: "bg",
  px: "0.5",
  top: "-3",
  insetStart: "2",
  fontWeight: "normal",
  pointerEvents: "none",
  transition: "all",
  _peerPlaceholderShown: {
    color: "var(--grey-500)",
    top: "2.5",
    insetStart: "3",
  },
  _peerFocusVisible: {
    color: "fg",
    top: "-3",
    insetStart: "2",
    bg: "transparent",
  },
});
