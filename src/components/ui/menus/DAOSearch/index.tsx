import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverTrigger,
  useDisclosure,
  useOutsideClick,
  Portal,
  Flex,
  Text,
  Icon,
} from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from '../../../../assets/theme/custom/icons/Search';
import { BACKGROUND_SEMI_TRANSPARENT, SEXY_BOX_SHADOW_T_T } from '../../../../constants/common';
import { useSearchDao } from '../../../../hooks/DAO/useSearchDao';
import { SearchDisplay } from './SearchDisplay';

export function DAOSearch() {
  const { t } = useTranslation(['dashboard']);
  const [localInput, setLocalInput] = useState<string>('');
  const [typing, setTyping] = useState<boolean>(false);
  const { errorMessage, isLoading, setSearchString, resolvedAddressesWithPrefix } = useSearchDao();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const ref = useRef<HTMLInputElement>(null);

  const debouncedInput = useMemo(
    () =>
      debounce((input: string) => {
        setSearchString(input);

        // This avoids a small "results" flicker of old state
        // right before next search kicks off.
        setTimeout(() => {
          setTyping(false);
        }, 50);
      }, 500),
    [setSearchString],
  );

  useEffect(() => {
    debouncedInput(localInput);
    setTyping(true);
  }, [debouncedInput, localInput]);

  useEffect(() => {
    return () => {
      debouncedInput.cancel();
    };
  }, [debouncedInput]);

  const resetSearch = () => {
    onClose();
    setLocalInput('');
  };

  useOutsideClick({
    ref,
    handler: resetSearch,
  });

  const showResults = useMemo(() => {
    if (typing) return false;
    if (isLoading) return true;
    return true;
  }, [typing, isLoading]);

  useEffect(() => {
    if (localInput) {
      onOpen();
    } else {
      onClose();
    }
  }, [localInput, onOpen, onClose]);

  return (
    <Box position="relative">
      <Portal>
        <Box
          position="fixed"
          left="0"
          top="0"
          width="100vw"
          height="100vh"
          backgroundColor={BACKGROUND_SEMI_TRANSPARENT}
          backdropFilter={isOpen ? 'blur(10px)' : 'blur(0px)'}
          zIndex="overlay"
          transition="all 300ms ease-in-out"
          opacity={isOpen ? 1 : 0}
          visibility={isOpen ? 'visible' : 'hidden'}
          sx={{
            _before: {
              content: '""',
              transition: 'backdrop-filter 300ms ease-in-out',
            },
          }}
        />
      </Portal>

      <Box
        ref={ref}
        width="full"
        position="relative"
        zIndex={isOpen ? 'modal' : ''}
      >
        <Popover
          matchWidth
          isLazy
          isOpen={showResults}
        >
          <PopoverTrigger data-testid="header-searchMenuButton">
            <InputGroup
              h="full"
              flexDirection="column"
              justifyContent="center"
            >
              <InputLeftElement ml="0.5rem">
                <Search
                  boxSize="1.75rem"
                  color="color-neutral-400"
                />
              </InputLeftElement>
              <Input
                background="color-neutral-950"
                size="baseAddonLeft"
                w="full"
                placeholder={t('searchDAOPlaceholder')}
                onChange={e => setLocalInput(e.target.value)}
                value={localInput}
                spellCheck="false"
                autoCapitalize="none"
                isInvalid={!!errorMessage && !typing}
                data-testid="search-input"
                sx={{
                  paddingInlineStart: '3rem',
                }}
              />
            </InputGroup>
          </PopoverTrigger>
          <Box
            marginTop="0.25rem"
            rounded="0.5rem"
            bg="color-neutral-950"
            boxShadow={resolvedAddressesWithPrefix.length ? SEXY_BOX_SHADOW_T_T : 'none'}
            hidden={!showResults}
            w="full"
            position="absolute"
            maxHeight="70vh"
            overflowY="auto"
          >
            {!!errorMessage && (
              <Flex
                alignItems="center"
                gap="2"
                p="0.5rem 1rem"
              >
                <Icon
                  as={WarningCircle}
                  color="color-error-400"
                  boxSize="1.5rem"
                />
                <Text
                  textStyle="text-xl-regular"
                  color="color-error-400"
                >
                  {errorMessage}
                </Text>
              </Flex>
            )}
            {resolvedAddressesWithPrefix.map(resolved => (
              <SearchDisplay
                key={resolved.address}
                loading={isLoading}
                address={resolved.address}
                chainId={resolved.chainId}
                onClickView={resetSearch}
              />
            ))}
          </Box>
        </Popover>
      </Box>
    </Box>
  );
}
