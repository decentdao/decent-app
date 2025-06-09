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
      containerBoxProps={{
        minW: '165px',
        minHeight: '112px',
        mx: '0',
        p: '1rem',
      }}
      onClick={onProposalTemplateClick}
    >
      <Flex>
        <Icon
          boxSize="1.5rem"
          color="color-lilac-100"
          borderRadius={0}
          as={icon}
        />
      </Flex>
      <Text
        textStyle="text-sm-regular"
        color="color-white"
        my="0.5rem"
      >
        {title}
      </Text>
      <Text
        textStyle="text-sm-regular"
        color="color-neutral-400"
      >
        {description}
      </Text>
    </ContentBox>
  );
}
