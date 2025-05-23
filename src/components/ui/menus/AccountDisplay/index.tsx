import { Button, Menu, MenuButton, Portal } from '@chakra-ui/react';
import { RefObject } from 'react';
import { AccountMenuButton } from './AccountMenuButton';
import { WalletMenu } from './WalletMenu';

interface AccountDisplayProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export function AccountDisplay({ containerRef }: AccountDisplayProps) {
  return (
    // Portal here needed in order to
    <Menu
      placement="bottom-end"
      offset={[0, 4]}
    >
      <Button
        as={MenuButton}
        variant="tertiary"
        data-testid="header-accountMenu"
        paddingY="0.25rem"
        paddingX="1rem"
        paddingInline="0.75rem"
        color="white-0"
        borderRadius="0.5rem"
        _hover={{ color: 'white-0', bg: 'color-neutral-900' }}
        _active={{
          color: 'white-0',
          bg: 'color-neutral-900',
        }}
      >
        <AccountMenuButton />
      </Button>

      <Portal containerRef={containerRef}>
        <WalletMenu />
      </Portal>
    </Menu>
  );
}
