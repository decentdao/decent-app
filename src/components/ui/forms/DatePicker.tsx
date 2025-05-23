import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Show,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { ReactNode } from 'react';
import { Calendar } from 'react-calendar';
import { useTranslation } from 'react-i18next';
import '../../../assets/css/Calendar.css';
import { SEXY_BOX_SHADOW_T_T } from '../../../constants/common';
import { DEFAULT_DATE_FORMAT } from '../../../utils';
import { DatePickerTrigger } from '../../Roles/DatePickerTrigger';
import DraggableDrawer from '../containers/DraggableDrawer';

type DateOrNull = Date | null;
type OnDateChangeValue = DateOrNull | [DateOrNull, DateOrNull];

function DateDisplayBox({ date }: { date: Date | undefined }) {
  const { t } = useTranslation('common');
  return (
    <Flex
      gap="0.5rem"
      p="0.5rem 1rem"
      width={{ base: '100%', md: '11.125rem' }}
      bg="color-black"
      borderWidth="1px"
      borderRadius="0.25rem"
      borderColor="color-neutral-900"
    >
      <Icon
        as={CalendarBlank}
        boxSize="24px"
        color="neutral-5"
      />
      <Box color="neutral-7">{(date && format(date, DEFAULT_DATE_FORMAT)) ?? t('select')}</Box>
    </Flex>
  );
}

function SelectedDateDisplay({ selectedDate }: { selectedDate: Date | undefined }) {
  return (
    <Box ml="1rem">
      <DateDisplayBox date={selectedDate} />
    </Box>
  );
}

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

function DatePickerContainer({
  children,
  disabled,
  selectedDate,
  isOpen,
  onOpen,
  onClose,
}: {
  children: ReactNode[];
  disabled: boolean;
  selectedDate: Date | undefined;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  const boxShadow = useBreakpointValue({ base: 'none', md: SEXY_BOX_SHADOW_T_T });
  const maxBoxW = useBreakpointValue({ base: '100%', md: '26.875rem' });
  return (
    <>
      <Show below="md">
        <Button
          onClick={onOpen}
          variant="unstyled"
          p="0"
          flex={1}
          w="full"
          isDisabled={disabled}
          cursor={disabled ? 'not-allowed' : 'pointer'}
        >
          <DatePickerTrigger
            selectedDate={selectedDate}
            disabled={disabled}
          />
        </Button>

        <DraggableDrawer
          isOpen={isOpen}
          headerContent={undefined}
          onOpen={onOpen}
          onClose={onClose}
        >
          <Flex
            flexDir="column"
            justifySelf="center"
            borderRadius="0.5rem"
            boxShadow={boxShadow}
            maxW={maxBoxW}
            bg="color-neutral-950"
            pt="1.5rem"
          >
            {children}
          </Flex>
        </DraggableDrawer>
      </Show>
      <Show above="md">
        <Menu
          placement="top-start"
          closeOnSelect={false}
          isOpen={isOpen}
          onClose={onClose}
        >
          <MenuButton
            as={Button}
            variant="unstyled"
            p="0"
            w="full"
            isDisabled={disabled}
            cursor={disabled ? 'not-allowed' : 'pointer'}
            onClick={onOpen}
          >
            <DatePickerTrigger
              selectedDate={selectedDate}
              disabled={disabled}
            />
          </MenuButton>
          <MenuList zIndex={2}>
            <MenuItem>
              <Flex
                flexDir="column"
                justifySelf="center"
                borderRadius="0.5rem"
                boxShadow={boxShadow}
                maxW={maxBoxW}
                bg="color-neutral-950"
                pt="1.5rem"
              >
                {children}
              </Flex>
            </MenuItem>
          </MenuList>
        </Menu>
      </Show>
    </>
  );
}

function TodayBox({ isTodaySelected }: { isTodaySelected: () => boolean }) {
  // @dev @todo - This is a workaround to fix an issue with the dot not being centered on the current day. Gotta be a better way to fix this.
  const todayDotLeftMargin = useBreakpointValue({ base: '4.5vw', md: '1.15rem' });
  return (
    <Box
      ml={todayDotLeftMargin}
      bg={isTodaySelected() ? 'color-lilac-700' : 'white-1'}
      borderRadius="50%"
      w="4px"
      h="4px"
    />
  );
}

export function DatePicker({
  selectedDate,
  onChange,
  minDate,
  maxDate,
  disabled,
}: {
  onChange: (date: Date) => void;
  selectedDate: Date | undefined;
  minDate?: Date;
  maxDate?: Date;
  disabled: boolean;
}) {
  const isTodaySelected = () => {
    return !!selectedDate ? isToday(selectedDate) : false;
  };
  const { isOpen, onClose, onOpen } = useDisclosure();

  const handleDateChange = (e: OnDateChangeValue) => {
    if (e instanceof Date) {
      onChange?.(e);
      onClose(); // Close the menu after date selection
    }
  };

  return (
    <DatePickerContainer
      disabled={disabled}
      selectedDate={selectedDate}
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
    >
      <SelectedDateDisplay selectedDate={selectedDate} />
      <Divider my="1.5rem" />
      {!disabled && (
        <Calendar
          minDate={minDate}
          maxDate={maxDate}
          formatShortWeekday={(_, date) => date.toString().slice(0, 2)}
          prevLabel={<Icon as={CaretLeft} />}
          nextLabel={<Icon as={CaretRight} />}
          next2Label={null}
          prev2Label={null}
          tileContent={({ date }) =>
            isToday(date) ? <TodayBox isTodaySelected={isTodaySelected} /> : null
          }
          onChange={handleDateChange}
        />
      )}
    </DatePickerContainer>
  );
}
