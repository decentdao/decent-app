import { Box, keyframes } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface CircleLoaderProps {
  size?: string | number;
  speed?: number;
}

export function CircleLoader({ size = '2rem', speed = 1.6 }: CircleLoaderProps) {
  // a simple 0→360° spin
  const spin = keyframes`
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  `;

  return (
    <Box
      as={motion.img}
      src="/images/loader.svg"
      alt="Loading…"
      boxSize={size}
      mx="auto"
      animation={`${spin} ${speed}s linear infinite`}
    />
  );
}
