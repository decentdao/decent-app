import {
  Button,
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
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Calendar } from 'react-calendar';
import '../../../assets/css/Calendar.css';
import { SEXY_BOX_SHADOW_T_T } from '../../../constants/common';
import { DatePickerTrigger } from '../../Roles/DatePickerTrigger';
import DraggableDrawer from '../containers/DraggableDrawer';

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
  handleDateChange,
}: {
  minDate?: Date;
  maxDate?: Date;
  handleDateChange: (date: DateOrNull | [DateOrNull, DateOrNull]) => void;
}) {
  return (
    <Calendar
      minDate={minDate}
      maxDate={maxDate}
      formatShortWeekday={(_, date) => date.toString().slice(0, 2)}
      prevLabel={<Icon as={CaretLeft} />}
      nextLabel={<Icon as={CaretRight} />}
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
  boxShadow,
  maxBoxW,
  minDate,
  maxDate,
  handleDateChange,
}: {
  isOpen: boolean;
  boxShadow: string | undefined;
  maxBoxW: string | undefined;
  minDate?: Date;
  maxDate?: Date;
  handleDateChange: (date: DateOrNull | [DateOrNull, DateOrNull]) => void;
}) {
  return (
    <Flex
      flexDir="column"
      justifySelf="center"
      borderRadius="0.5rem"
      boxShadow={boxShadow}
      maxW={maxBoxW}
      pt={{ base: '1.5rem', md: 0 }}
    >
      {isOpen && (
        <CalendarView
          minDate={minDate}
          maxDate={maxDate}
          handleDateChange={handleDateChange}
        />
      )}
    </Flex>
  );
}

/** Mobile implementation – uses DraggableDrawer */
function MobilePicker({
  isOpen,
  boxShadow,
  maxBoxW,
  minDate,
  maxDate,
  handleDateChange,
  disabled,
  onOpen,
  onClose,
  selectedDate,
}: {
  isOpen: boolean;
  boxShadow: string | undefined;
  maxBoxW: string | undefined;
  minDate?: Date;
  maxDate?: Date;
  handleDateChange: (date: DateOrNull | [DateOrNull, DateOrNull]) => void;
  disabled: boolean;
  onOpen: () => void;
  onClose: () => void;
  selectedDate?: Date;
}) {
  return (
    <Show below="md">
      <Button
        onClick={onOpen}
        variant="unstyled"
        p={0}
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
        <CalendarContainer
          isOpen={isOpen}
          boxShadow={boxShadow}
          maxBoxW={maxBoxW}
          minDate={minDate}
          maxDate={maxDate}
          handleDateChange={handleDateChange}
        />
      </DraggableDrawer>
    </Show>
  );
}

function DesktopPicker({
  isOpen,
  boxShadow,
  maxBoxW,
  minDate,
  maxDate,
  handleDateChange,
  disabled,
  onOpen,
  onClose,
  selectedDate,
}: {
  isOpen: boolean;
  boxShadow: string | undefined;
  maxBoxW: string | undefined;
  minDate?: Date;
  maxDate?: Date;
  handleDateChange: (date: DateOrNull | [DateOrNull, DateOrNull]) => void;
  disabled: boolean;
  onOpen: () => void;
  onClose: () => void;
  selectedDate?: Date;
}) {
  return (
    <Show above="md">
      <Menu
        closeOnSelect={false}
        isOpen={isOpen}
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
        <MenuList zIndex={2}>
          <MenuItem>
            <CalendarContainer
              isOpen={isOpen}
              boxShadow={boxShadow}
              maxBoxW={maxBoxW}
              minDate={minDate}
              maxDate={maxDate}
              handleDateChange={handleDateChange}
            />
          </MenuItem>
        </MenuList>
      </Menu>
    </Show>
  );
}

export function DatePicker({
  selectedDate,
  onChange,
  minDate,
  maxDate,
  disabled = false,
}: DatePickerProps) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const boxShadow = useBreakpointValue({ base: 'none', md: SEXY_BOX_SHADOW_T_T });
  const maxBoxW = useBreakpointValue({ base: '100%', md: '26.875rem' });

  const handleDateChange = (value: OnDateChangeValue) => {
    if (value instanceof Date) {
      onChange(value);
      onClose();
    }
  };

  return (
    <>
      <MobilePicker
        isOpen={isOpen}
        boxShadow={boxShadow}
        maxBoxW={maxBoxW}
        minDate={minDate}
        maxDate={maxDate}
        handleDateChange={handleDateChange}
        disabled={disabled}
        onOpen={onOpen}
        onClose={onClose}
        selectedDate={selectedDate}
      />
      <DesktopPicker
        isOpen={isOpen}
        boxShadow={boxShadow}
        maxBoxW={maxBoxW}
        minDate={minDate}
        maxDate={maxDate}
        handleDateChange={handleDateChange}
        disabled={disabled}
        onOpen={onOpen}
        onClose={onClose}
        selectedDate={selectedDate}
      />
    </>
  );
}
