import React from 'react';
import styled from '@emotion/styled';

interface SpinnerProps {
  size?: string;
  color?: string;
  speed?: string;
  style?: React.CSSProperties;
}

const SpinnerContainer = styled.div<SpinnerProps>`
  --uib-size: ${props => props.size || '2.8rem'};
  --uib-speed: ${props => props.speed || '0.9s'};
  --uib-color: ${props => props.color || 'var(--grey-500)'};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: var(--uib-size);
  width: var(--uib-size);
`;

const SpinnerDot = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  width: 100%;

  &::before {
    content: '';
    height: 20%;
    width: 20%;
    border-radius: 50%;
    background-color: var(--uib-color);
    transform: scale(0);
    opacity: 0.5;
    animation: pulse0112 calc(var(--uib-speed) * 1.111) ease-in-out infinite;
    box-shadow: 0 0 20px rgba(18, 31, 53, 0.3);
  }

  &:nth-of-type(2) {
    transform: rotate(45deg);
  }

  &:nth-of-type(2)::before {
    animation-delay: calc(var(--uib-speed) * -0.875);
  }

  &:nth-of-type(3) {
    transform: rotate(90deg);
  }

  &:nth-of-type(3)::before {
    animation-delay: calc(var(--uib-speed) * -0.75);
  }

  &:nth-of-type(4) {
    transform: rotate(135deg);
  }

  &:nth-of-type(4)::before {
    animation-delay: calc(var(--uib-speed) * -0.625);
  }

  &:nth-of-type(5) {
    transform: rotate(180deg);
  }

  &:nth-of-type(5)::before {
    animation-delay: calc(var(--uib-speed) * -0.5);
  }

  &:nth-of-type(6) {
    transform: rotate(225deg);
  }

  &:nth-of-type(6)::before {
    animation-delay: calc(var(--uib-speed) * -0.375);
  }

  &:nth-of-type(7) {
    transform: rotate(270deg);
  }

  &:nth-of-type(7)::before {
    animation-delay: calc(var(--uib-speed) * -0.25);
  }

  &:nth-of-type(8) {
    transform: rotate(315deg);
  }

  &:nth-of-type(8)::before {
    animation-delay: calc(var(--uib-speed) * -0.125);
  }
`;

const keyframes = `
  @keyframes pulse0112 {
    0%,
    100% {
      transform: scale(0);
      opacity: 0.5;
    }

    50% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const Spinner: React.FC<SpinnerProps> = ({ size, color, speed, style }) => {
  return (
    <>
      <style>{keyframes}</style>
      <SpinnerContainer size={size} color={color} speed={speed} style={style}>
        <SpinnerDot />
        <SpinnerDot />
        <SpinnerDot />
        <SpinnerDot />
        <SpinnerDot />
        <SpinnerDot />
        <SpinnerDot />
        <SpinnerDot />
      </SpinnerContainer>
    </>
  );
};

export default Spinner;
