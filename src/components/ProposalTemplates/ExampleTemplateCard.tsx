import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Icon as PhosphorIcon } from '@phosphor-icons/react';
import ContentBox from '../ui/containers/ContentBox';
import Markdown from '../ui/proposal/Markdown';

type ExampleTemplateCardProps = {
  icon: PhosphorIcon;
  title: string;
  description: string;
  onProposalTemplateClick: () => void;
};

export default function ExampleTemplateCard({
  icon,
  title,
  description,
  onProposalTemplateClick,
}: ExampleTemplateCardProps) {
  return (
    <ContentBox
      containerBoxProps={{ flex: '0 0 calc(33.333333% - 0.6666666rem)', my: '0' }}
      onClick={onProposalTemplateClick}
    >
      <Flex justifyContent="space-between">
        <Icon
          w="50px"
          h="50px"
          color="color-lilac-100"
          borderRadius={0}
          textStyle="text-3xl-regular"
          as={icon}
        />
      </Flex>
      <Text
        textStyle="text-xl-regular"
        color="color-white"
        my="0.5rem"
      >
        {title}
      </Text>
      <Box color="color-neutral-400">
        <Markdown content={description} />
      </Box>
    </ContentBox>
  );
}
