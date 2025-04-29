import { Flex, HStack, Modal, ModalContent, ModalOverlay, Spacer, Text } from '@chakra-ui/react';
import { Warning, X } from '@phosphor-icons/react';
import { ReactNode } from 'react';
import {
  BACKGROUND_SEMI_TRANSPARENT,
  MAX_CONTENT_WIDTH,
  SIDEBAR_WIDTH,
} from '../../../constants/common';
import Divider from '../utils/Divider';

export type ModalBaseSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'max';
interface ModuleBaseProps {
  isSearchInputModal?: boolean;
  title?: string;
  warn?: boolean;
  size?: ModalBaseSize;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  closeOnOverlayClick?: boolean;
}
/**
 * The base wrapper component for a modal.  This displays the Chakra components necessary to open a modal,
 * as well as the title of the modal.  The child component provided is displayed as the modal content.
 */
export function ModalBase({
  zIndex,
  isOpen,
  onClose,
  isSearchInputModal,
  children,
  title,
  warn,
  size = 'lg',
  closeOnOverlayClick = true,
}: ModuleBaseProps) {
  return (
    <Modal
      isCentered
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay
        backgroundColor={BACKGROUND_SEMI_TRANSPARENT}
        backdropFilter="auto"
        backdropBlur="10px"
        zIndex={zIndex}
      />
      {isSearchInputModal ? (
        <ModalContent
          mx={{ base: '1rem', md: '1.5rem' }}
          mt={{ base: '9.5rem' }}
          pl={{ base: '0', md: SIDEBAR_WIDTH }}
          maxW={`calc(${MAX_CONTENT_WIDTH} + ${SIDEBAR_WIDTH})`}
          zIndex={zIndex ? zIndex + 1 : undefined}
        >
          {children}
        </ModalContent>
      ) : (
        <ModalContent
          bg="neutral-2"
          borderRadius="0.5rem"
          boxShadow="0px 0px 0px 1px #100414, 0px 0px 0px 1px rgba(248, 244, 252, 0.04) inset, 0px 1px 0px 0px rgba(248, 244, 252, 0.04) inset"
          padding="1.5rem"
          containerProps={
            zIndex
              ? {
                  zIndex: zIndex + 1,
                }
              : undefined
          }
        >
          {title && (
            <>
              <Flex
                color="lilac-0"
                marginBottom="1rem"
              >
                <HStack>
                  {warn && <Warning size="20" />}
                  <Text
                    color="white-0"
                    textStyle="heading-small"
                  >
                    {title}
                  </Text>
                </HStack>
                <Spacer />
                <X
                  cursor="pointer"
                  onClick={onClose}
                />
              </Flex>
              <Divider marginBottom="1rem" />
            </>
          )}
          {children}
        </ModalContent>
      )}
    </Modal>
  );
}
