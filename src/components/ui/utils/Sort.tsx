import { Button, Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { NEUTRAL_2_82_TRANSPARENT } from '../../../constants/common';
import { SortBy } from '../../../types';
import Divider from './Divider';
import { EaseOutComponent } from './EaseOutComponent';

function SortMenuItem({
  labelKey,
  testId,
  onClick,
}: {
  labelKey: string;
  testId: string;
  onClick: () => void;
}) {
  const { t } = useTranslation('common');
  return (
    <MenuItem
      borderRadius="0.75rem"
      p="0.5rem 0.5rem"
      sx={{
        '&:hover': { bg: 'color-neutral-900' },
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
  const { t } = useTranslation('common');
  return (
    <Menu isLazy>
      <MenuButton
        as={Button}
        variant="tertiary"
        p="0.25rem 0.5rem"
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
        borderColor="color-neutral-900"
        borderRadius="0.75rem"
        bg={NEUTRAL_2_82_TRANSPARENT}
        backdropFilter="auto"
        backdropBlur="10px"
        minWidth="min-content"
        zIndex={5}
        p="0.25rem"
      >
        <EaseOutComponent>
          <Text
            px="0.5rem"
            my="0.25rem"
            textStyle="text-xs-medium"
            color="color-neutral-300"
          >
            {t('sortTitle')}
          </Text>
          <SortMenuItem
            labelKey={SortBy.Newest}
            testId="sort-newest"
            onClick={() => setSortBy(SortBy.Newest)}
          />
          <Divider my="0.25rem" />
          <SortMenuItem
            labelKey={SortBy.Oldest}
            testId="sort-oldest"
            onClick={() => setSortBy(SortBy.Oldest)}
          />
        </EaseOutComponent>
      </MenuList>
    </Menu>
  );
}
