import styled from "@emotion/styled";

export default function Footer() {
  return (
    <FooterContainer>
      <div></div>
    </FooterContainer>
  );
}

const FooterContainer = styled.footer`
  min-height: var(--footer-height);
  background-color: var(--grey-100);
`;
