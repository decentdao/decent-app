import {
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Calendar } from 'react-calendar';
import '../../../assets/css/Calendar.css';
import { DatePickerTrigger } from '../../Roles/DatePickerTrigger';

type DateOrNull = Date | null;
type OnDateChangeValue = DateOrNull | [DateOrNull, DateOrNull];

interface DatePickerProps {
  onChange: (date: Date) => void;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

/** Shared Calendar component with our default props */
function CalendarView({
  minDate,
  maxDate,
  selectedDate,
  handleDateChange,
}: {
  minDate?: Date;
  maxDate?: Date;
  selectedDate?: Date;
  handleDateChange: (date: DateOrNull | [DateOrNull, DateOrNull]) => void;
}) {
  return (
    <Calendar
      minDate={minDate}
      maxDate={maxDate}
      formatShortWeekday={(_, date) => date.toString().slice(0, 2)}
      prevLabel={<Icon as={CaretLeft} />}
      nextLabel={<Icon as={CaretRight} />}
      defaultActiveStartDate={selectedDate ?? minDate}
      value={selectedDate}
      // remove double-skip buttons for cleaner UI
      next2Label={null}
      prev2Label={null}
      tileContent={null}
      onChange={handleDateChange}
    />
  );
}

/** Wrapper giving the calendar consistent styling */
function CalendarContainer({
  isOpen,
  maxBoxW,
  minDate,
  maxDate,
  selectedDate,
  handleDateChange,
}: {
  isOpen: boolean;
  maxBoxW: string | undefined;
  minDate?: Date;
  maxDate?: Date;
  selectedDate?: Date;
  handleDateChange: (date: DateOrNull | [DateOrNull, DateOrNull]) => void;
}) {
  return (
    <Flex
      flexDir="column"
      justifySelf="center"
      borderRadius="0.5rem"
      maxW={maxBoxW}
      pt={{ base: '1.5rem', md: 0 }}
    >
      {isOpen && (
        <CalendarView
          minDate={minDate}
          maxDate={maxDate}
          selectedDate={selectedDate}
          handleDateChange={handleDateChange}
        />
      )}
    </Flex>
  );
}

function DesktopPicker({
  onChange,
  maxBoxW,
  minDate,
  maxDate,
  disabled,
  selectedDate,
}: {
  onChange: (date: Date) => void;
  maxBoxW: string | undefined;
  minDate?: Date;
  maxDate?: Date;
  disabled: boolean;
  selectedDate?: Date;
}) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const handleDateChange = (value: OnDateChangeValue) => {
    if (value instanceof Date) {
      onChange(value);
      onClose();
    }
  };
  return (
    <Menu
      closeOnSelect={false}
      onClose={onClose}
    >
      <MenuButton
        as={Button}
        variant="unstyled"
        p={0}
        w="full"
        h="40px"
        borderRadius="0.5rem"
        isDisabled={disabled}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        onClick={onOpen}
      >
        <DatePickerTrigger
          selectedDate={selectedDate}
          disabled={disabled}
        />
      </MenuButton>
      <MenuList zIndex={3}>
        <MenuItem>
          <CalendarContainer
            isOpen={isOpen}
            maxBoxW={maxBoxW}
            minDate={minDate}
            maxDate={maxDate}
            selectedDate={selectedDate}
            handleDateChange={handleDateChange}
          />
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

export function DatePicker({
  selectedDate,
  onChange,
  minDate,
  maxDate,
  disabled = false,
}: DatePickerProps) {
  const maxBoxW = useBreakpointValue({ base: '100%', md: '26.875rem' });

  return (
    <>
      <DesktopPicker
        onChange={onChange}
        maxBoxW={maxBoxW}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        selectedDate={selectedDate}
      />
    </>
  );
}
