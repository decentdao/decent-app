import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { NEUTRAL_2_82_TRANSPARENT } from '../../../constants/common';
import { SortBy } from '../../../types';
import Divider from './Divider';

function SortMenuItem({
  labelKey,
  testId,
  onClick,
}: {
  labelKey: string;
  testId: string;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <MenuItem
      borderRadius="0.5rem"
      p="0.75rem 0.5rem"
      sx={{
        '&:hover': { bg: 'neutral-3' },
      }}
      data-testid={testId}
      onClick={onClick}
    >
      <Text>{t(labelKey)}</Text>
    </MenuItem>
  );
}

interface ISort {
  sortBy: SortBy;
  setSortBy: Dispatch<SetStateAction<SortBy>>;
  buttonProps?: {
    disabled?: boolean;
  };
}

export function Sort({ sortBy, setSortBy, buttonProps }: ISort) {
  const { t } = useTranslation();
  return (
    <Menu direction="ltr">
      <MenuButton
        data-testid="sort-openMenu"
        color="lilac-0"
        p="0.25rem 0.5rem"
        sx={{
          '&:hover': {
            color: 'lilac--1',
            bg: 'white-alpha-04',
            borderRadius: '0.25rem',
          },
        }}
        {...buttonProps}
      >
        <Flex alignItems="center">
          <Text>{t(sortBy)}</Text>
          <Icon
            ml="0.25rem"
            p={1.25}
            as={CaretDown}
          />
        </Flex>
      </MenuButton>

      <MenuList
        borderWidth="1px"
        borderColor="neutral-3"
        borderRadius="0.5rem"
        bg={NEUTRAL_2_82_TRANSPARENT}
        backdropFilter="auto"
        backdropBlur="10px"
        minWidth="min-content"
        zIndex={5}
      >
        <Text
          px="0.5rem"
          mt={2}
          textStyle="helper-text-small"
          color="neutral-7"
        >
          {t('sortTitle')}
        </Text>
        <SortMenuItem
          labelKey={SortBy.Newest}
          testId="sort-newest"
          onClick={() => setSortBy(SortBy.Newest)}
        />
        {/* TODO Divider look doesn't quite match */}
        <Divider />
        <SortMenuItem
          labelKey={SortBy.Oldest}
          testId="sort-oldest"
          onClick={() => setSortBy(SortBy.Oldest)}
        />
      </MenuList>
    </Menu>
  );
}
