import { Avatar, Box, Flex, Tag, TagLabel, Text } from '@chakra-ui/react';
import { Dot } from '@phosphor-icons/react';
import ContentBox from '../ui/containers/ContentBox';
import Markdown from '../ui/proposal/Markdown';

type DappCardProps = {
  title: string;
  appUrl: string;
  iconUrl: string;
  description: string;
  categories: string[];
};

export default function DappCard({
  title,
  appUrl,
  iconUrl,
  description,
  categories,
}: DappCardProps) {
  return (
    <ContentBox
      containerBoxProps={{ flex: '0 0 calc(33.333333% - 0.6666666rem)', my: '0' }}
      onClick={() => console.log('DappCard clicked', appUrl)}
    >
      <Flex
        justifyContent="center"
        mb="1rem"
      >
        <Avatar
          size="xl"
          src={iconUrl}
          name={title}
          color="lilac-0"
        />
      </Flex>
      <Text
        textStyle="heading-small"
        color="white-0"
        align="center"
        mb="1rem"
      >
        {title}
      </Text>
      <Box
        color="neutral-7"
        textAlign="center"
        mb="1rem"
      >
        <Markdown content={description} />
      </Box>
      <Flex
        flexDirection={'row'}
        flexWrap="wrap"
        gap="0.5rem"
        color="neutral-7"
      >
        {categories.map(category => (
          <Tag
            size="md"
            key={category}
            variant="subtle"
            colorScheme="cyan"
          >
            <Dot
              size={12}
              style={{ transform: 'scale(6)' }}
            />

            <TagLabel ml="0.5rem">{category}</TagLabel>
          </Tag>
        ))}
      </Flex>
    </ContentBox>
  );
}
