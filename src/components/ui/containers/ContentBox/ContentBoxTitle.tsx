import { Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

function ContentBoxTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      textStyle="text-xl-regular"
      color="white-0"
    >
      {children}
    </Text>
  );
}

export default ContentBoxTitle;
