import { Box, Button, ButtonProps, Flex, Icon, IconButton, Spacer, Text } from '@chakra-ui/react';
import { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { ReactNode, useEffect, useState } from 'react';
import { CONTENT_MAXW } from '../../../../constants/common';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useGlobalStore } from '../../../../store/store';
import AddressCopier from '../../links/AddressCopier';
import Divider from '../../utils/Divider';
import Breadcrumbs, { Crumb } from './Breadcrumbs';

interface PageHeaderProps {
  title?: string;
  showSafeAddress?: boolean;
  breadcrumbs: Crumb[];
  hasDAOLink?: boolean;
  ButtonIcon?: PhosphorIcon;
  buttonProps?: ButtonProps;
  children?: ReactNode;
}
/**
 * A component which displays a page title and an optional action button.
 * Intended to be used as the main title for a page.
 */
function PageHeader({
  title,
  breadcrumbs,
  hasDAOLink = true,
  ButtonIcon,
  buttonProps,
  children,
  showSafeAddress,
}: PageHeaderProps) {
  const { daoKey } = useCurrentDAOKey();
  const { getDaoNode } = useGlobalStore();

  const { addressPrefix } = useNetworkConfigStore();

  const [links, setLinks] = useState([...breadcrumbs]);
  const node = daoKey ? getDaoNode(daoKey) : null;
  const safeAddress = node?.safe?.address;
  const subgraphInfo = node?.subgraphInfo;

  useEffect(() => {
    if (hasDAOLink && safeAddress) {
      const safeAddressSubstring = subgraphInfo?.daoName ?? createAccountSubstring(safeAddress);
      if (!safeAddressSubstring) return;
      setLinks([
        {
          terminus: safeAddressSubstring,
          path: DAO_ROUTES.dao.relative(addressPrefix, safeAddress),
        },
        ...breadcrumbs,
      ]);
    }
  }, [hasDAOLink, subgraphInfo?.daoName, safeAddress, breadcrumbs, addressPrefix]);

  const showAction = !!buttonProps || !!ButtonIcon || !!children;

  return (
    <Box
      marginTop="2rem"
      marginBottom="0.5rem"
      maxW={CONTENT_MAXW}
    >
      <Flex
        alignItems="center"
        gap={{ base: 1, sm: 4 }}
        w="full"
      >
        <Breadcrumbs
          links={links}
          w={!showAction ? { base: 'full', sm: 'full' } : undefined}
        />
        {showAction && (
          <>
            <Spacer />
            {buttonProps && !ButtonIcon && <Button {...buttonProps} />}
            {ButtonIcon && (
              <IconButton
                {...buttonProps}
                aria-label="navigate"
                icon={
                  <Icon
                    boxSize="1.25rem"
                    as={ButtonIcon}
                  />
                }
                variant="tertiary"
                size="icon-sm"
                as={Button}
              />
            )}
            {children}
          </>
        )}
      </Flex>
      <Divider
        variant="darker"
        mt="1rem"
      />
      {title && (
        <Text
          marginTop="2rem"
          textStyle="text-3xl-regular"
          color="color-white"
        >
          {title}
        </Text>
      )}
      {safeAddress && showSafeAddress && (
        <AddressCopier
          marginTop="0.5rem"
          address={safeAddress}
          display="inline-flex"
        />
      )}
    </Box>
  );
}
export default PageHeader;
