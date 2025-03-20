import { Flex, Icon, Text } from '@chakra-ui/react';
import { Icon as PhosphorIcon } from '@phosphor-icons/react';
import ContentBox from '../ui/containers/ContentBox';

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
          color="#DCC8F0"
          borderRadius={0}
          as={icon}
        />
      </Flex>
      <Text
        textStyle="heading-small"
        color="white-0"
        my="0.5rem"
      >
        {title}
      </Text>
      <Text
        textStyle="heading-xs"
        color="gray"
        my="0.5rem"
      >
        {description}
      </Text>
    </ContentBox>
  );
}
