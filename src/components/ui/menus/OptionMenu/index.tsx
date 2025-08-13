import {
  Menu,
  MenuButton,
  MenuList,
  As,
  MenuProps,
  Portal,
  Box,
  ButtonProps,
  IconButtonProps,
} from '@chakra-ui/react';
import { MouseEvent, ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { NEUTRAL_2_82_TRANSPARENT } from '../../../../constants/common';
import { DecentTooltip } from '../../DecentTooltip';
import { OptionsList } from './OptionsList';
import { IOption, IOptionsList } from './types';

type ExtendedButtonProps = (ButtonProps | IconButtonProps) & {
  'data-testid'?: string;
};

interface OptionMenuProps extends Omit<MenuProps, 'children'>, IOptionsList {
  trigger: ReactNode;
  tooltipKey?: string;
  options: IOption[];
  buttonAs?: As;
  buttonProps?: ExtendedButtonProps;
  children?: ReactNode;
  menuListMr?: string;
  containerRef?: RefObject<HTMLDivElement | null>;
}

export function OptionMenu({
  trigger,
  titleKey,
  tooltipKey,
  options,
  namespace,
  buttonAs,
  showOptionSelected,
  showOptionCount,
  buttonProps,
  children,
  closeOnSelect = true,
  menuListMr,
  containerRef,
  ...rest
}: OptionMenuProps) {
  const { t } = useTranslation(namespace);

  const menuList = (
    <MenuList
      borderWidth="1px"
      borderColor="color-neutral-900"
      borderRadius="0.78rem"
      mr={menuListMr || ['auto', '1rem']}
      zIndex="popover"
    >
      <Box
        borderRadius="0.75rem"
        bg={NEUTRAL_2_82_TRANSPARENT}
        backdropFilter="auto"
        backdropBlur="10px"
      >
        {children}
        <OptionsList
          options={options}
          showOptionSelected={showOptionSelected}
          closeOnSelect={closeOnSelect}
          showOptionCount={showOptionCount}
          namespace={namespace}
          titleKey={titleKey}
        />
      </Box>
    </MenuList>
  );

  return (
    <Menu
      isLazy
      {...rest}
    >
      <DecentTooltip
        closeDelay={0}
        hasArrow
        label={tooltipKey ? t(tooltipKey) : undefined}
        placement="right"
      >
        <MenuButton
          as={buttonAs}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
          }}
          {...buttonProps}
          borderRadius="0.75rem"
        >
          {trigger}
        </MenuButton>
      </DecentTooltip>
      {containerRef !== undefined ? (
        <Portal containerRef={containerRef}>{menuList}</Portal>
      ) : (
        menuList
      )}
    </Menu>
  );
}
