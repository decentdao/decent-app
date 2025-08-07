import { Button, Icon as ChakraIcon } from '@chakra-ui/react';
import { X } from '@phosphor-icons/react';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEMO_MODE_QUERY_PARAM = 'demo_mode';
const DEMO_MODE_STORAGE_KEY = `decent_${DEMO_MODE_QUERY_PARAM}`;

const DEMO_MODE_VALUES = {
  ON: 'on',
  OFF: 'off',
} as const;

type DemoModeValueTypes = typeof DEMO_MODE_VALUES;
type DemoModeValue = DemoModeValueTypes[keyof DemoModeValueTypes];

export function useInitializeDemoMode() {
  const [searchParams] = useSearchParams();

  const rawValue = searchParams.get(DEMO_MODE_QUERY_PARAM)?.toLowerCase();

  if (rawValue === DEMO_MODE_VALUES.ON) {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, DEMO_MODE_VALUES.ON);
  } else if (rawValue === DEMO_MODE_VALUES.OFF) {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, DEMO_MODE_VALUES.OFF);
  }
}

export function isDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_MODE_STORAGE_KEY) === DEMO_MODE_VALUES.ON;
  } catch {
    return false;
  }
}

function useToggleDemoMode() {
  const [searchParams, setSearchParams] = useSearchParams();

  return useCallback(
    (demoModeValue: DemoModeValue) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set(DEMO_MODE_QUERY_PARAM, demoModeValue);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );
}

function DemoModeToggleButton() {
  const handleToggleMode = useToggleDemoMode();

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => handleToggleMode(DEMO_MODE_VALUES.OFF)}
      pr="0.3rem"
    >
      {'Demo'}
      <ChakraIcon
        as={X}
        boxSize="16px"
        position="relative"
      />
    </Button>
  );
}

export function DemoModeButton() {
  return <>{isDemoMode() && <DemoModeToggleButton />}</>;
}
