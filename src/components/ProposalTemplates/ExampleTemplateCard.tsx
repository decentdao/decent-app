import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Icon as PhosphorIcon } from '@phosphor-icons/react';
import ContentBox from '../ui/containers/ContentBox';

type ExampleTemplateCardProps = {
  icon: PhosphorIcon;
  title: string;
  description: string;
  onProposalTemplateClick: () => void;
  testId: string;
  showUpgradeBadge?: boolean;
  onUpgradeBadgeClick?: () => void;
};

export default function ExampleTemplateCard({
  icon,
  title,
  description,
  onProposalTemplateClick,
  testId,
  showUpgradeBadge = false,
  onUpgradeBadgeClick,
}: ExampleTemplateCardProps) {
  const handleClick =
    showUpgradeBadge && onUpgradeBadgeClick ? onUpgradeBadgeClick : onProposalTemplateClick;

  return (
    <ContentBox
      containerBoxProps={{
        minW: '165px',
        minHeight: '112px',
        mx: '0',
        p: '1rem',
      }}
      onClick={handleClick}
      testId={testId}
    >
      <Flex
        position="relative"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Icon
          boxSize="1.5rem"
          color="color-lilac-100"
          borderRadius={0}
          as={icon}
        />
        {showUpgradeBadge && (
          <Box
            bg="color-primary-400"
            color="color-white"
            borderRadius="0.5rem"
            px="4px"
            py="2px"
            textStyle="text-xs-medium"
            minH="20px"
            h="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="absolute"
            top="0"
            right="0"
            cursor="pointer"
            onClick={e => {
              e.stopPropagation();
              onUpgradeBadgeClick?.();
            }}
          >
            Upgrade
          </Box>
        )}
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
