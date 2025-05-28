import { Avatar, Box, Flex, Icon, Tag, TagLabel, Text } from '@chakra-ui/react';
import { Dot } from '@phosphor-icons/react';
import { SEXY_BOX_SHADOW_T_T } from '../../constants/common';
import { ModalType } from '../ui/modals/ModalProvider';
import { useDecentModal } from '../ui/modals/useDecentModal';
import Divider from '../ui/utils/Divider';

type DappCardProps = {
  title: string;
  appUrl: string;
  iconUrl: string;
  description: string;
  categories: string[];
  onClose: () => void;
};

export default function DappCard({
  title,
  appUrl,
  iconUrl,
  description,
  categories,
  onClose,
}: DappCardProps) {
  const { open: openDappBrowserModal } = useDecentModal(ModalType.DAPP_BROWSER, {
    appUrl,
  });

  return (
    <Box
      flex="0 0 calc(25% - 1rem)"
      my="0"
      p="0"
      bg="neutral-2"
      rounded="xl"
      cursor="pointer"
      _hover={{
        bg: 'neutral-3',
      }}
      boxShadow={SEXY_BOX_SHADOW_T_T}
      onClick={() => {
        onClose();
        openDappBrowserModal();
      }}
    >
      <Box
        p="12px"
        pb="20px"
      >
        <Flex mb="8px">
          <Avatar
            width={10}
            height={10}
            src={iconUrl}
            name={title}
            color="lilac-0"
          />
        </Flex>
        <Text textStyle="body-large">{title}</Text>
        <Text
          textStyle="labels-large"
          color="neutral-7"
          noOfLines={2}
        >
          {description}
        </Text>
      </Box>
      {categories.length > 0 && (
        <>
          <Divider boxShadow="0px -1px 0px 0px #000" />
          <Flex
            p="12px"
            flexDirection={'row'}
            flexWrap="wrap"
            gap="0.5rem"
          >
            {categories.map(category => (
              <Tag
                size="md"
                rounded="full"
                key={category}
                variant="subtle"
                bg="neutral-4"
              >
                <Icon
                  color="neutral-7"
                  as={Dot}
                  style={{ transform: 'scale(6)' }}
                />
                <TagLabel
                  ml="8px"
                  color="neutral-7"
                >
                  {category}
                </TagLabel>
              </Tag>
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
}
