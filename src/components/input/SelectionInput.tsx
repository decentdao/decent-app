import { Box, Flex, Icon, Image, RadioGroup } from '@chakra-ui/react';
import { CheckCircle } from '@phosphor-icons/react';
import { LabelComponent } from '../ui/forms/InputComponent';
import { RadioWithText } from '../ui/forms/Radio/RadioWithText';
import { DropdownMenu } from '../ui/menus/DropdownMenu';
import { ISelectionInput } from './Interfaces';

export function DropdownMenuSelection({
  label,
  description,
  selected,
  options,
  isDisabled = false,
  onValueChange,
}: ISelectionInput) {
  return (
    <Box
      mt="2rem"
      mb="1.5rem"
    >
      <LabelComponent
        label={label}
        helper={description}
        isRequired
        alignLabel="flex-start"
      >
        <DropdownMenu
          items={options}
          selectedItem={options.find(item => item.value === selected)}
          onSelect={item => {
            onValueChange?.(item.value);
          }}
          title={label}
          isDisabled={isDisabled}
          renderItem={(item, isSelected) => {
            return (
              <>
                <Flex
                  alignItems="center"
                  gap="1rem"
                >
                  <Image
                    src={item.icon}
                    fallbackSrc="/images/coin-icon-default.svg"
                    boxSize="2rem"
                  />
                  {item.label}
                </Flex>
                {isSelected && (
                  <Icon
                    as={CheckCircle}
                    boxSize="1.5rem"
                    color="lilac-0"
                  />
                )}
              </>
            );
          }}
        />
      </LabelComponent>
    </Box>
  );
}

export function RadioSelection({
  id,
  label,
  description,
  selected,
  options,
  onValueChange,
}: ISelectionInput) {
  return (
    <Box
      mt="2rem"
      mb="1.5rem"
    >
      <LabelComponent
        label={label}
        helper={description}
        isRequired
      >
        <RadioGroup
          display="flex"
          flexDirection="column"
          name={label}
          gap={4}
          mt="-0.5rem" // RadioGroup renders empty paragraph with margin, seems like this is only feasible way to align this group
          id={id}
          value={selected}
          onChange={value => {
            onValueChange?.(value);
          }}
        >
          {options.map(option => (
            <RadioWithText
              key={option.value}
              label={option.label}
              description={option.description ?? ''}
              testId={option.testId ?? option.value}
              value={option.value}
            />
          ))}
        </RadioGroup>
      </LabelComponent>
    </Box>
  );
}

export function HorizontalRadioSelection({
  id,
  label,
  selected,
  options,
  onValueChange,
}: ISelectionInput) {
  return (
    <RadioGroup
      display="flex"
      flexDirection="row"
      name={label}
      gap={8}
      ml="0.25rem"
      id={id}
      value={selected}
      onChange={value => {
        onValueChange?.(value);
      }}
    >
      {options.map(option => (
        <RadioWithText
          key={option.value}
          label={option.label}
          description={option.description ?? ''}
          testId={option.testId ?? option.value}
          value={option.value}
        />
      ))}
    </RadioGroup>
  );
}
