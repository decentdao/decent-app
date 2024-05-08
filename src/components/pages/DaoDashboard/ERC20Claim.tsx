import { Alert, AlertTitle, Button, Flex, Text } from '@chakra-ui/react';
import { Alert as AlertIcon } from '@decent-org/fractal-ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransaction } from '../../../hooks/utils/useTransaction';
import { useFractal } from '../../../providers/App/AppProvider';
import { AzoriusGovernance } from '../../../types';
import { formatCoin } from '../../../utils/numberFormats';

export function ERCO20Claim() {
  const [userClaimable, setUserClaimable] = useState(0n);
  const {
    governance,
    readOnly: { user },
  } = useFractal();
  const account = user.address;
  const { tokenClaimContract, type } = governance;
  const { t } = useTranslation(['dashboard', 'transaction']);
  const [contractCall, pending] = useTransaction();
  const azoriusGovernance = governance as AzoriusGovernance;

  const loadClaim = useCallback(async () => {
    if (!tokenClaimContract || !type || !account) {
      return;
    }
    const claimableAmount = (await tokenClaimContract.getClaimAmount(account)).toBigInt();
    setUserClaimable(claimableAmount);
  }, [tokenClaimContract, type, account]);

  useEffect(() => {
    loadClaim();
  }, [loadClaim]);

  const claimToken = async () => {
    if (!tokenClaimContract || !azoriusGovernance.votesToken || !account) {
      return;
    }
    const claimableString = formatCoin(
      userClaimable,
      false,
      azoriusGovernance.votesToken.decimals,
      azoriusGovernance.votesToken.symbol,
    );
    contractCall({
      contractFn: () => tokenClaimContract.claimTokens(account),
      pendingMessage: t('pendingTokenClaim', {
        symbol: azoriusGovernance.votesToken.symbol,
        ns: 'transaction',
      }),
      failedMessage: t('failedTokenClaim', {
        symbol: azoriusGovernance.votesToken.symbol,
        ns: 'transaction',
      }),
      successMessage: t('successTokenClaim', {
        amount: claimableString,
        symbol: azoriusGovernance.votesToken.symbol,
        ns: 'transaction',
      }),
      successCallback: loadClaim,
    });
  };

  if (!azoriusGovernance.votesToken || userClaimable === 0n) return null;
  const claimableString = formatCoin(
    userClaimable,
    false,
    azoriusGovernance.votesToken.decimals,
    azoriusGovernance.votesToken.symbol,
  );
  return (
    <Alert
      status="info"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={8}
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
      >
        <AlertIcon boxSize="24px" />
        <AlertTitle>
          <Text whiteSpace="pre-wrap">
            {t('alertTokenClaim', {
              amount: claimableString,
            })}
          </Text>
        </AlertTitle>
      </Flex>
      <Button
        variant="text"
        onClick={claimToken}
        isDisabled={pending}
      >
        {t('claim')}
      </Button>
    </Alert>
  );
}
