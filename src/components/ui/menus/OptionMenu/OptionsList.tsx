import { Box, Flex, MenuItem, Checkbox, Text } from '@chakra-ui/react';
import { ChangeEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Divider from '../../utils/Divider';
import { IOption, IOptionsList } from './types';

export function OptionsList({
  options,
  showOptionSelected,
  closeOnSelect,
  showOptionCount,
  namespace,
  titleKey,
}: IOptionsList) {
  const { t } = useTranslation(namespace || 'menu');
  const createHandleItemClick =
    (option: IOption) => (e: MouseEvent<HTMLButtonElement> | ChangeEvent) => {
      e.stopPropagation();
      option.onClick();
    };
  return (
    <Box py="0.25rem">
      {titleKey && (
        <Text
          pt="0.5rem"
          px="0.5rem"
          textStyle="labels-small"
          color="neutral-7"
        >
          {t(titleKey)}
        </Text>
      )}
      {options.map((option, i) => {
        const clickListener = createHandleItemClick(option);

        return (
          <Box
            px="0.25rem"
            key={option.optionKey}
          >
            {option.renderer ? (
              option.renderer()
            ) : (
              <MenuItem
                as={showOptionSelected ? Box : Text}
                onClick={clickListener}
                isDisabled={option.isDisabled}
                cursor="pointer"
                _hover={{ bg: 'neutral-3', textDecoration: 'none' }}
                _disabled={{ cursor: 'not-allowed', opacity: 0.5 }}
                p="0.5rem"
                borderRadius="0.5rem"
                gap={2}
                closeOnSelect={closeOnSelect}
                data-testid={'optionMenu-' + option.optionKey}
              >
                {showOptionSelected ? (
                  <Flex flex="1">
                    <Checkbox
                      isChecked={option.isSelected}
                      onChange={clickListener}
                      marginEnd="0.5rem"
                      sx={{
                        '& .chakra-checkbox__control': {
                          borderRadius: '0.25rem',
                        },
                      }}
                    />
                    {t(option.optionKey)}
                  </Flex>
                ) : (
                  t(option.optionKey)
                )}
                {showOptionCount && <Text as="span">{option.count}</Text>}
              </MenuItem>
            )}

            {i !== options.length - 1 && <Divider my="0.25rem" />}
          </Box>
        );
      })}
    </Box>
  );
}
