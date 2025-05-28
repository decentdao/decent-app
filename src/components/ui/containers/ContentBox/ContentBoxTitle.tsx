import { Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

function ContentBoxTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      textStyle="heading-small"
      color="color-white"
    >
      {children}
    </Text>
  );
}

export default ContentBoxTitle;
