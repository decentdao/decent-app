import { Box, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface TokenSaleCountdownProps {
  endTimestamp: bigint;
}

const zeroPad = (num: number) => String(num).padStart(2, '0');

export function TokenSaleCountdown({ endTimestamp }: TokenSaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = Number(endTimestamp);
      const diff = endTime - now;

      return diff > 0 ? diff : 0;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTimestamp]);

  if (timeLeft <= 0) {
    return (
      <Box
        bg="color-content-content2"
        borderRadius="8px"
        px={1}
        py={0.5}
      >
        <Text
          textStyle="text-xs-medium"
          color="color-content-content1-foreground"
        >
          Ended
        </Text>
      </Box>
    );
  }

  const days = Math.floor(timeLeft / (60 * 60 * 24));
  const hours = Math.floor((timeLeft / (60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / 60) % 60);
  const seconds = Math.floor(timeLeft % 60);

  const timeString = `${zeroPad(days)}:${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}`;

  return (
    <Box
      bg="color-content-content2"
      borderRadius="8px"
      px={1}
      py={0.5}
    >
      <Text
        textStyle="text-xs-medium"
        color="color-content-content1-foreground"
      >
        {timeString}
      </Text>
    </Box>
  );
}
