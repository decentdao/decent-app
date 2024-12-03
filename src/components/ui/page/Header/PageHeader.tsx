import { Box, Button, ButtonProps, Flex, Icon, IconButton, Spacer, Text } from '@chakra-ui/react';
import { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { ReactNode, useEffect, useState } from 'react';
import { CONTENT_MAXW } from '../../../../constants/common';
import { DAO_ROUTES } from '../../../../constants/routes';
import { createAccountSubstring } from '../../../../hooks/utils/useGetAccountName';
import { useNetworkConfig } from '../../../../providers/NetworkConfig/NetworkConfigProvider';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
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
  const { safe, subgraphInfo } = useDaoInfoStore();

  const { addressPrefix } = useNetworkConfig();
  const safeAddress = safe?.address;

  const [links, setLinks] = useState([...breadcrumbs]);

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
      marginTop="3rem"
      marginBottom="1.5rem"
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
          textStyle="heading-large"
          color="white-0"
        >
          {title}
        </Text>
      )}
      {safe?.address && showSafeAddress && (
        <AddressCopier
          marginTop="0.5rem"
          address={safe?.address}
          display="inline-flex"
        />
      )}
    </Box>
  );
}
export default PageHeader;
