/* eslint-disable react/function-component-definition */
import { Button, ButtonProps, Icon, Link } from '@chakra-ui/react';
import { t } from 'i18next';

interface Props extends ButtonProps {
  snapshotENS: string;
}

const SnapshotIconSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path
      d="M3.26362 10.5915L13.4401 1.77646C13.5535 1.66301 13.8825 1.67427 13.9846 1.77646C14.2091 2.00107 14.0527 2.34371 13.9846 2.45716L10.8194 8.65153H15.9927C16.5032 8.65153 16.8095 8.68557 16.8436 9.02592C16.8708 9.2982 16.7415 9.43434 16.6734 9.46837C13.4628 12.2479 6.98023 17.8614 6.73517 18.0792C6.42886 18.3515 6.08851 18.3856 5.8843 18.2494C5.72093 18.1405 5.81623 17.7956 5.8843 17.6368L8.98148 11.4084H3.91028C2.93008 11.4084 3.07075 10.8638 3.26362 10.5915Z"
      fill="#DCC8F0"
    />
  </svg>
);

export const SnapshotIcon = () => <Icon as={SnapshotIconSVG} />;

export function SnapshotButton({ snapshotENS }: Props) {
  return (
    <Button
      href={`https://snapshot.org/#/${snapshotENS}`}
      as={Link}
      target="_blank"
      variant="primary"
      bg={'color-neutral-900'}
      borderRadius="625rem"
      color={'color-lilac-100'}
      borderWidth="1px"
      borderColor="transparent"
      _hover={{ textDecoration: 'none', bg: 'color-neutral-800' }}
      _active={{ bg: 'color-neutral-900', borderColor: 'color-neutral-800' }}
      size={'sm'}
      p={'0.25rem 0.75rem'}
      width={'fit-content'}
    >
      <SnapshotIcon />
      {t('snapshot')}
    </Button>
  );
}
