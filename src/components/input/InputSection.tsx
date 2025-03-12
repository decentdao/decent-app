import { Flex } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';
import ContentBoxTitle from '../ui/containers/ContentBox/ContentBoxTitle';
import { IInputSection } from './Interfaces';

export function InputSection({ label, children }: PropsWithChildren<IInputSection>) {
  return (
    <Flex
      flexDirection="column"
      gap={8}
    >
      {label && <ContentBoxTitle>{label}</ContentBoxTitle>}
      {children}
    </Flex>
  );
}
