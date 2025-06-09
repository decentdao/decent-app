import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import * as Yup from 'yup';
import { DAOEssentials, GovernanceType } from '../../../types';
import { useValidationAddress } from '../common/useValidationAddress';
import { useDAOCreateTests } from './useDAOCreateTests';
import { useERC20TokenSchema } from './useERC20TokenSchema';

/**
 * validation schema for DAO Create workflow
 * @dev https://www.npmjs.com/package/yup
 */
export const useDAOCreateSchema = ({
  isSubDAO,
  totalParentVotingWeight,
}: {
  isSubDAO: boolean;
  totalParentVotingWeight: bigint | undefined;
}) => {
  const {
    addressValidationTestSimple,
    addressValidationTest,
    uniqueAddressValidationTest,
    uniqueNFTAddressValidationTest,
    ensNameValidationTest,
  } = useValidationAddress();
  const { minValueValidation, validERC721Address, isBigIntValidation } = useDAOCreateTests();

  const { erc20TokenShape } = useERC20TokenSchema();

  const { t } = useTranslation(['daoCreate']);

  const createDAOValidation = useMemo(
    () =>
      Yup.object().shape({
        essentials: Yup.object().shape({
          daoName: Yup.string().required(),
          governance: Yup.string().required(),
          snapshotENS: Yup.string().test(ensNameValidationTest),
        }),
        multisig: Yup.object().when('essentials', {
          is: ({ governance }: DAOEssentials) => governance === GovernanceType.MULTISIG,
          then: _schema =>
            _schema.shape({
              trustedAddresses: Yup.array()
                .min(1)
                .when({
                  is: (array: Address[]) => array && array.length > 1,
                  then: schema =>
                    schema.of(
                      Yup.string().test(addressValidationTest).test(uniqueAddressValidationTest),
                    ),
                  otherwise: schema => schema.of(Yup.string().test(addressValidationTest)),
                }),
              signatureThreshold: Yup.number()
                .min(1, t('errorLowSignerThreshold'))
                .max(Yup.ref('numOfSigners'), t('errorHighSignerThreshold'))
                .required(t('errorHighSignerThreshold')),
              numOfSigners: Yup.number()
                .min(1, t('errorMinSigners'))
                .required(t('errorMinSigners')),
              customNonce: Yup.number(),
            }),
        }),
        erc20Token: Yup.object().when('essentials', {
          is: ({ governance }: DAOEssentials) => governance === GovernanceType.AZORIUS_ERC20,
          then: () => erc20TokenShape,
        }),
        erc721Token: Yup.object().when('essentials', {
          is: ({ governance }: DAOEssentials) => governance === GovernanceType.AZORIUS_ERC721,
          then: _schema =>
            _schema.shape({
              nfts: Yup.array()
                .min(1)
                .of(
                  Yup.object().shape({
                    tokenAddress: Yup.string()
                      .test(addressValidationTestSimple)
                      .test(uniqueNFTAddressValidationTest)
                      .test(validERC721Address),
                    tokenWeight: Yup.object()
                      .required()
                      .shape({
                        value: Yup.string().test(isBigIntValidation).test(minValueValidation(1)), // Otherwise "0" treated as proper value
                      }),
                  }),
                ),
            }),
        }),
        azorius: Yup.object().when('essentials', {
          is: ({ governance }: DAOEssentials) =>
            governance === GovernanceType.AZORIUS_ERC20 ||
            governance === GovernanceType.AZORIUS_ERC721,
          then: _schema =>
            _schema.shape({
              quorumPercentage: Yup.object().shape({ value: Yup.string().required() }),
              timelock: Yup.object().shape({ value: Yup.string().required() }),
              votingPeriod: Yup.object().shape({
                value: Yup.string().required().test(minValueValidation(1)),
              }),
              executionPeriod: Yup.object().shape({
                value: Yup.string().required().test(minValueValidation(1)),
              }),
            }),
        }),
        freeze: Yup.object().when({
          is: () => isSubDAO,
          then: _schema =>
            _schema.shape({
              executionPeriod: Yup.object().shape({
                value: Yup.string().required().test(minValueValidation(1)),
              }),
              timelockPeriod: Yup.object().shape({ value: Yup.string().required() }),
              freezeVotesThreshold: Yup.object()
                .shape({
                  value: Yup.string().required(),
                  bigintValue: Yup.mixed<bigint>()
                    .test({
                      message: t('errorMinimumValue', { ns: 'common', minValue: 0 }),
                      test: value => {
                        return value !== undefined ? value > 0 : true;
                      },
                    })
                    .test({
                      message: t('errorMaximumValue', {
                        ns: 'common',
                        maxValue: totalParentVotingWeight?.toString(),
                      }),
                      test: value => {
                        if (
                          value === undefined ||
                          (totalParentVotingWeight !== undefined &&
                            value <= totalParentVotingWeight)
                        ) {
                          return true;
                        }
                        return false;
                      },
                    }),
                })
                .required(),
              freezeProposalPeriod: Yup.object().shape({ value: Yup.string().required() }),
              freezePeriod: Yup.object().shape({ value: Yup.string().required() }),
            }),
        }),
      }),
    [
      ensNameValidationTest,
      isSubDAO,
      t,
      addressValidationTest,
      uniqueAddressValidationTest,
      addressValidationTestSimple,
      erc20TokenShape,
      uniqueNFTAddressValidationTest,
      validERC721Address,
      isBigIntValidation,
      minValueValidation,
      totalParentVotingWeight,
    ],
  );
  return { createDAOValidation };
};
