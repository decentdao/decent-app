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

  /** Shared Calendar component with our default props */
  function CalendarView() {
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
  function CalendarContainer() {
    return (
      <Flex
        flexDir="column"
        justifySelf="center"
        borderRadius="0.5rem"
        boxShadow={boxShadow}
        maxW={maxBoxW}
        pt={{ base: '1.5rem', md: 0 }}
      >
        {isOpen && <CalendarView />}
      </Flex>
    );
  }

  /** Mobile implementation – uses DraggableDrawer */
  function MobilePicker() {
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
          <CalendarContainer />
        </DraggableDrawer>
      </Show>
    );
  }

  /** Desktop implementation – uses Chakra Menu */
  function DesktopPicker() {
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
              <CalendarContainer />
            </MenuItem>
          </MenuList>
        </Menu>
      </Show>
    );
  }

  return (
    <>
      <MobilePicker />
      <DesktopPicker />
    </>
  );
}
