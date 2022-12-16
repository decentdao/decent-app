import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { Search } from '@decent-org/fractal-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSearchDao from '../../../../hooks/DAO/useSearchDao';
import { SearchDisplay } from './SearchDisplay';

export function DAOSearch() {
  const [searchAddressInput, setSearchAddressInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation(['dashboard']);

  const {
    errorMessage,
    loading,
    address,
    resetErrorState,
    addressIsGnosisSafe,
    updateSearchString,
  } = useSearchDao();

  const selectInput = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const unFocusInput = () => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const searchUpdate = useCallback(
    (inputAddress: string) => {
      setSearchAddressInput(inputAddress);
      updateSearchString(inputAddress);
    },
    [updateSearchString]
  );

  useEffect(() => {
    return () => {
      resetErrorState();
    };
  });

  return (
    <Box
      width="full"
      maxW="31.125rem"
      height="full"
    >
      <Menu
        matchWidth
        isLazy
        defaultIsOpen={true}
        onOpen={selectInput}
        onClose={() => {
          setSearchAddressInput('');
          updateSearchString('');
          unFocusInput();
        }}
      >
        <MenuButton
          h="full"
          w="full"
          data-testid="header-searchMenuButton"
        >
          <InputGroup>
            <InputLeftElement>
              <Search
                boxSize="1.5rem"
                color="grayscale.300"
              />
            </InputLeftElement>
            <Input
              ref={inputRef}
              size="baseAddonLeft"
              placeholder={t('searchDAOPlaceholder')}
              onChange={e => searchUpdate(e.target.value)}
              value={searchAddressInput}
            />
          </InputGroup>
        </MenuButton>
        <MenuList
          onFocus={focusInput}
          border="none"
          rounded="lg"
          shadow="menu-gold"
          bg="grayscale.black"
          hidden={!errorMessage && !address}
        >
          <Box p="0.5rem 1rem">
            <SearchDisplay
              loading={loading}
              errorMessage={errorMessage}
              validAddress={addressIsGnosisSafe}
              address={address}
            />
          </Box>
        </MenuList>
      </Menu>
    </Box>
  );
}
