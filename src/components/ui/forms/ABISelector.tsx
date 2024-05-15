import { Select, Text } from '@chakra-ui/react';
import axios from 'axios';
import detectProxyTarget from 'evm-proxy-detection';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isAddress } from 'viem';
import { useEnsAddress, usePublicClient } from 'wagmi';
import { logError } from '../../../helpers/errorLogging';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import { LabelComponent } from './InputComponent';

export type ABIElement = {
  type: 'function' | 'constructor' | 'fallback' | 'event';
  name: string;
  stateMutability: 'view' | 'nonpayable' | 'pure';
  inputs: { type: string; name: string; internalType: string }[];
};

interface IABISelector {
  /*
   * @param target - target contract address or ENS name
   */
  target?: string;
  onChange: (value: ABIElement) => void;
}

export default function ABISelector({ target, onChange }: IABISelector) {
  const [abi, setABI] = useState<ABIElement[]>([]);
  const { etherscanAPIUrl } = useNetworkConfig();
  const { t } = useTranslation('common');
  const { data: ensAddress } = useEnsAddress({ name: target });
  const client = usePublicClient();

  useEffect(() => {
    const loadABI = async () => {
      if (client && target && ((ensAddress && isAddress(ensAddress)) || isAddress(target))) {
        try {
          const requestFunc = ({ method, params }: { method: any; params: any }) =>
            client.request({ method, params });

          const proxy = await detectProxyTarget(ensAddress || target, requestFunc);

          const response = await axios.get(
            `${etherscanAPIUrl}&module=contract&action=getabi&address=${proxy || ensAddress || target}`,
          );
          const responseData = response.data;

          if (responseData.status === '1') {
            const fetchedABI = JSON.parse(responseData.result);
            setABI(fetchedABI);
          }
        } catch (e) {
          logError(e, 'Error fetching ABI for smart contract');
        }
      }
    };
    loadABI();
  }, [target, ensAddress, etherscanAPIUrl, client]);

  /*
   * This makes component quite scoped to proposal / proposal template creation
   * but we can easily adopt displayed options based on needs later
   */

  const abiFunctions = useMemo(
    () =>
      abi.filter(
        (abiElement: ABIElement) =>
          abiElement.type === 'function' &&
          abiElement.stateMutability !== 'pure' &&
          abiElement.stateMutability !== 'view',
      ),
    [abi],
  );

  if (!abiFunctions || !abiFunctions.length) {
    return null; // TODO: Show "error state" or "empty state"?
  }

  return (
    <LabelComponent
      label={t('abi')}
      helper={t('abiSelectorHelper')}
      isRequired={false}
    >
      <Select
        placeholder={t('select')}
        variant="outline"
        bg="input.background"
        borderColor="black.200"
        borderWidth="1px"
        borderRadius="4px"
        color="white"
        onChange={e => {
          const selectedFunction = abiFunctions.find(
            (abiFunction: ABIElement) => abiFunction.name === e.target.value,
          );
          if (!selectedFunction) throw new Error('Issue finding selected function');
          onChange(selectedFunction);
        }}
        sx={{ '> option, > optgroup': { bg: 'input.background' } }}
      >
        {abiFunctions.map((abiFunction: ABIElement) => (
          <option key={abiFunction.name}>{abiFunction.name}</option>
        ))}
      </Select>
      <Text color="grayscale.500">{t('abiSelectorDescription')}</Text>
    </LabelComponent>
  );
}
