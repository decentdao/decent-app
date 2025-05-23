import { Button, ButtonProps, Icon, Text } from '@chakra-ui/react';
import { Icon as PhosphorIcon } from '@phosphor-icons/react';

type CeleryButtonWithIconProps = {
  icon?: PhosphorIcon;
  text: string;
  iconPosition?: 'start' | 'end';
} & ButtonProps;

export default function CeleryButtonWithIcon({
  icon,
  onClick,
  text,
  iconPosition = 'start',
  ...rest
}: CeleryButtonWithIconProps) {
  return (
    <Button
      variant="text"
      color="color-green-400"
      maxWidth="100%"
      padding="0.25rem 0.75rem"
      gap="0.25rem"
      borderRadius="625rem"
      borderColor="transparent"
      borderWidth="1px"
      _hover={{ bg: 'celery--6', borderColor: 'celery--6' }}
      _active={{ bg: 'celery--6', borderWidth: '1px', borderColor: 'celery--5' }}
      onClick={onClick}
      {...rest}
    >
      {iconPosition === 'start' && icon && <Icon as={icon} />}
      <Text
        textOverflow="ellipsis"
        overflow="hidden"
      >
        {text}
      </Text>
      {iconPosition === 'end' && icon && <Icon as={icon} />}
    </Button>
  );
}
