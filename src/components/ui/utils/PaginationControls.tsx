import {
  Button,
  Flex,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDown,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { NEUTRAL_2_82_TRANSPARENT } from '../../../constants/common';
import { PAGE_SIZE_OPTIONS } from '../../../hooks/utils/usePagination';
import { EaseOutComponent } from './EaseOutComponent';

interface NavButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  iconComponent: ComponentType;
}

function NavButton({ onClick, isDisabled, iconComponent: IconComponent }: NavButtonProps) {
  return (
    <Button
      onClick={onClick}
      isDisabled={isDisabled}
      variant="tertiary"
      size="sm"
    >
      <IconComponent />
    </Button>
  );
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: PaginationControlsProps) {
  const { t } = useTranslation(['common']);

  return (
    <Flex
      align="center"
      gap={2}
    >
      <Menu isLazy>
        <MenuButton
          as={Button}
          variant="tertiary"
          size="sm"
        >
          <Flex alignItems="center">
            <Text fontSize="sm">{pageSize}</Text>
            <Icon
              ml="0.25rem"
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
            {PAGE_SIZE_OPTIONS.map(size => (
              <MenuItem
                key={size}
                borderRadius="0.75rem"
                p="0.5rem 0.5rem"
                sx={{
                  '&:hover': { bg: 'color-neutral-900' },
                }}
                onClick={() => onPageSizeChange(size)}
              >
                <Text fontSize="sm">{size}</Text>
              </MenuItem>
            ))}
          </EaseOutComponent>
        </MenuList>
      </Menu>

      <HStack spacing={1}>
        <NavButton
          onClick={() => onPageChange(1)}
          isDisabled={currentPage === 1}
          iconComponent={CaretDoubleLeft}
        />
        <NavButton
          onClick={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage === 1 || currentPage > totalPages}
          iconComponent={CaretLeft}
        />

        <Text
          fontSize="sm"
          px={2}
          color="color-lilac-100"
        >
          {t('pageXofY', { current: currentPage, total: totalPages })}
        </Text>

        <NavButton
          onClick={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage >= totalPages}
          iconComponent={CaretRight}
        />
        <NavButton
          onClick={() => onPageChange(totalPages)}
          isDisabled={currentPage >= totalPages}
          iconComponent={CaretDoubleRight}
        />
      </HStack>
    </Flex>
  );
}
