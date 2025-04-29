import { Avatar, Box, Flex, Icon, Tag, TagLabel, Text } from '@chakra-ui/react';
import { Dot } from '@phosphor-icons/react';
import ContentBox from '../ui/containers/ContentBox';
import { ModalType } from '../ui/modals/ModalProvider';
import { useDecentModal } from '../ui/modals/useDecentModal';
import Markdown from '../ui/proposal/Markdown';
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
  const openDappBrowserModal = useDecentModal(ModalType.DAPP_BROWSER, {
    appUrl,
  });

  return (
    <ContentBox
      containerBoxProps={{
        flex: '0 0 calc(25% - 1rem)',
        my: '0',
        bg: 'neutral-3',
        p: '0.5rem',
        _hover: {
          bg: 'neutral-4',
        },
      }}
      onClick={() => {
        onClose();
        openDappBrowserModal();
      }}
    >
      <Flex mb="0.5rem">
        <Avatar
          size="sm"
          src={iconUrl}
          name={title}
          color="lilac-0"
        />
      </Flex>
      <Text
        color="white-0"
        mb="0.5rem"
      >
        {title}
      </Text>
      <Box
        color="neutral-7"
        mb="1rem"
      >
        <Markdown
          content={description}
          collapsedLines={2}
          truncate
        />
      </Box>
      {categories.length > 0 && (
        <>
          <Divider />
          <Flex
            mt="1rem"
            flexDirection={'row'}
            flexWrap="wrap"
            gap="0.5rem"
          >
            {categories.map(category => (
              <Tag
                size="md"
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
                  ml="0.5rem"
                  color="neutral-7"
                >
                  {category}
                </TagLabel>
              </Tag>
            ))}
          </Flex>
        </>
      )}
    </ContentBox>
  );
}
