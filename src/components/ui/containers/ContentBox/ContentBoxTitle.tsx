import { Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

function ContentBoxTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      textStyle="text-xl-regular"
      color="color-white"
    >
      {children}
    </Text>
  );
}

export default ContentBoxTitle;
