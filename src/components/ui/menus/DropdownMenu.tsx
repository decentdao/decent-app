import {
  Button,
  Divider,
  Flex,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Show,
  Text,
} from '@chakra-ui/react';
import { CaretDown, CheckCircle } from '@phosphor-icons/react';
import { CARD_SHADOW } from '../../../constants/common';
import DraggableDrawer from '../containers/DraggableDrawer';
import { EaseOutComponent } from '../utils/EaseOutComponent';
type DropdownItem<T> = T & {
  value: string;
  label: string;
  icon?: string;
  selected?: boolean;
};
interface DropdownMenuProps<T = {}> {
  items: DropdownItem<T>[];
  selectedItem?: DropdownItem<T>;
  title?: string;
  onSelect: (item: DropdownItem<T>) => void;
  isDisabled?: boolean;
  selectPlaceholder?: string;
  emptyMessage?: string;
  /**
   * Optional custom renderer for each item.
   * If provided, the returned node should include everything inside the MenuItem,
   * including the selected icon if desired.
   */
  renderItem?: (item: DropdownItem<T>, isSelected: boolean) => React.ReactNode;
}

export function DropdownMenu<T>({
  items,
  selectedItem,
  title,
  onSelect,
  isDisabled,
  selectPlaceholder = 'Select',
  emptyMessage = 'No items available',
  renderItem,
}: DropdownMenuProps<T>) {
  return (
    <Menu
      placement="bottom-end"
      offset={[0, 8]}
    >
      {({ isOpen, onClose }) => (
        <>
          <MenuButton
            as={Button}
            variant="unstyled"
            bgColor="transparent"
            isDisabled={isDisabled}
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
            p={0}
            sx={{
              '&:hover': {
                'payment-menu-asset': {
                  color: 'lilac--1',
                  bg: 'white-alpha-04',
                },
              },
            }}
          >
            <Flex
              gap={2}
              alignItems="center"
              border="1px solid"
              borderColor="neutral-4"
              borderRadius="9999px"
              w="fit-content"
              className="payment-menu-asset"
              p="0.5rem"
            >
              {selectedItem?.icon && (
                <Image
                  src={selectedItem.icon}
                  fallbackSrc="/images/coin-icon-default.svg"
                  boxSize="1.5rem"
                />
              )}
              <Flex
                alignItems="center"
                gap="0.75rem"
              >
                <Text
                  textStyle="body-large"
                  color="white-0"
                >
                  {selectedItem?.label ?? selectPlaceholder}
                </Text>
                <Icon
                  color="neutral-6"
                  as={CaretDown}
                  boxSize="1.5rem"
                />
              </Flex>
            </Flex>
          </MenuButton>

          {/* Mobile view: Draggable Drawer */}
          <Show below="lg">
            <DraggableDrawer
              isOpen={isOpen}
              onOpen={() => {}}
              onClose={onClose}
              closeOnOverlayClick
              headerContent={
                <Flex
                  flexWrap="wrap"
                  gap="1rem"
                >
                  {title && <Text textStyle="heading-small">{title}</Text>}
                  <Divider
                    variant="darker"
                    mx="-1.5rem"
                    width="calc(100% + 3rem)"
                  />
                </Flex>
              }
            >
              <Flex
                gap="0.25rem"
                padding="0.25rem"
                mt="-1rem"
                flexDir="column"
              >
                {items.length === 0 && (
                  <Flex
                    p="1rem"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text
                      textStyle="heading-small"
                      color="neutral-7"
                    >
                      {emptyMessage}
                    </Text>
                  </Flex>
                )}
                {items.map((item, index) => {
                  const isSelected = !!item.selected;
                  return (
                    <MenuItem
                      key={index}
                      p="1rem"
                      _hover={{ bg: 'white-alpha-04' }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      borderRadius="0.5rem"
                      justifyContent="space-between"
                      w="full"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                    >
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <>
                          <Flex
                            alignItems="center"
                            gap="1rem"
                          >
                            {item.icon && (
                              <Image
                                src={item.icon}
                                fallbackSrc="/images/coin-icon-default.svg"
                                boxSize="2rem"
                              />
                            )}
                            <Text
                              textStyle="labels-large"
                              color="white-0"
                            >
                              {item.label}
                            </Text>
                          </Flex>
                          {isSelected && (
                            <Icon
                              as={CheckCircle}
                              boxSize="1.5rem"
                              color="lilac-0"
                            />
                          )}
                        </>
                      )}
                    </MenuItem>
                  );
                })}
              </Flex>
            </DraggableDrawer>
          </Show>

          {/* Desktop view: MenuList */}
          <Show above="lg">
            <MenuList
              zIndex={2}
              bg="linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.04) 100%), #221D25"
              pt="1rem"
              boxShadow={CARD_SHADOW}
              borderRadius="0.75rem"
              px="0.25rem"
              pb="0.25rem"
              w="26.75rem"
            >
              <EaseOutComponent>
                {title && (
                  <>
                    <Text
                      px="1rem"
                      textStyle="labels-small"
                      color="neutral-7"
                    >
                      {title}
                    </Text>
                    <Divider
                      variant="darker"
                      mt="1rem"
                      mb="0.25rem"
                      mx="-0.25rem"
                      width="calc(100% + 0.5rem)"
                    />
                  </>
                )}
                {items.length === 0 && (
                  <Flex
                    p="1rem"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text
                      textStyle="heading-small"
                      color="neutral-7"
                    >
                      {emptyMessage}
                    </Text>
                  </Flex>
                )}
                {items.map((item, index) => {
                  const isSelected = !!item.selected;
                  return (
                    <MenuItem
                      key={index}
                      p="1rem"
                      _hover={{ bg: 'white-alpha-04' }}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      borderRadius="0.5rem"
                      justifyContent="space-between"
                      w="full"
                      onClick={() => onSelect(item)}
                    >
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <>
                          <Flex
                            alignItems="center"
                            gap="1rem"
                          >
                            {item.icon && (
                              <Image
                                src={item.icon}
                                fallbackSrc="/images/coin-icon-default.svg"
                                boxSize="2rem"
                              />
                            )}
                            <Text
                              textStyle="labels-large"
                              color="white-0"
                            >
                              {item.label}
                            </Text>
                          </Flex>
                          {isSelected && (
                            <Icon
                              as={CheckCircle}
                              boxSize="1.5rem"
                              color="lilac-0"
                            />
                          )}
                        </>
                      )}
                    </MenuItem>
                  );
                })}
              </EaseOutComponent>
            </MenuList>
          </Show>
        </>
      )}
    </Menu>
  );
}
