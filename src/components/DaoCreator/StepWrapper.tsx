import { Box, Flex, Text } from '@chakra-ui/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BASE_ROUTES, DAO_ROUTES } from '../../constants/routes';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { CreatorSteps } from '../../types';
import PageHeader from '../ui/page/Header/PageHeader';
import { DAOCreateMode } from './formComponents/EstablishEssentials';

interface IStepWrapper {
  isSubDAO?: boolean;
  isFormSubmitting?: boolean;
  shouldWrapChildren?: boolean;
  children: ReactNode;
  mode: DAOCreateMode;
  allSteps: CreatorSteps[];
  stepNumber: number;
}

function Step({ index, stepNumber, label }: { index: number; stepNumber: number; label: string }) {
  return (
    <Box width="100%">
      <Box
        height="4px"
        bg={stepNumber >= index ? 'lilac-0' : 'neutral-6'}
        borderRadius="full"
      />
      <Text
        mx="0.25rem"
        mt="0.5rem"
        textStyle="labels-large"
        color={stepNumber === index ? 'white-0' : 'neutral-6'}
      >
        {index}. {label}
      </Text>
    </Box>
  );
}

export function StepWrapper({
  isSubDAO,
  isFormSubmitting,
  children,
  mode,
  allSteps,
  stepNumber,
  shouldWrapChildren = true,
}: IStepWrapper) {
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation(['breadcrumbs']);
  const navigate = useNavigate();

  const isEdit = mode === DAOCreateMode.EDIT;

  let title = '';
  switch (mode) {
    case DAOCreateMode.ROOTDAO:
      title = t('createNewDAO');
      break;
    case DAOCreateMode.SUBDAO:
      title = t('createSubDAO');
      break;
    case DAOCreateMode.EDIT:
      title = t('editDAO');
      break;
    default:
      throw new Error('Invalid DAO create mode');
  }

  return (
    <Box>
      {isEdit ? (
        <Box marginBottom="2rem">
          <Flex
            alignItems="center"
            w="full"
          >
            <Text
              textStyle="heading-large"
              color="white-0"
            >
              {title}
            </Text>
          </Flex>
        </Box>
      ) : (
        <PageHeader
          title={title}
          hasDAOLink={!!isSubDAO}
          breadcrumbs={[
            {
              terminus: title,
              path: '',
            },
          ]}
          ButtonIcon={ArrowLeft}
          buttonProps={{
            variant: 'secondary',
            isDisabled: isFormSubmitting,
            onClick: () =>
              navigate(
                !isSubDAO || !safe?.address
                  ? BASE_ROUTES.landing
                  : DAO_ROUTES.dao.relative(addressPrefix, safe.address),
              ),
          }}
        />
      )}
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        width="100%"
        mb="2rem"
        gap="0.25rem"
      >
        {allSteps.map((step, index) => {
          let label = '';
          switch (step) {
            case CreatorSteps.ESSENTIALS:
              label = t('titleGetStarted', { ns: 'daoCreate' });
              break;
            case CreatorSteps.ERC20_DETAILS:
              label = t('titleConfigureERC20', { ns: 'daoCreate' });
              break;
            case CreatorSteps.ERC721_DETAILS:
              label = t('titleConfigureERC721', { ns: 'daoCreate' });
              break;
            case CreatorSteps.MULTISIG_DETAILS:
              label = t('titleConfigureMultisig', { ns: 'daoCreate' });
              break;
            case CreatorSteps.AZORIUS_DETAILS:
              label = t('titleGovConfig', { ns: 'daoCreate' });
              break;
            case CreatorSteps.FREEZE_DETAILS:
              label = t('titleGuardConfig', { ns: 'daoCreate' });
              break;
            default:
              throw new Error('Invalid step');
          }
          return (
            <Step
              key={index}
              index={index + 1}
              stepNumber={stepNumber}
              label={label}
            />
          );
        })}
      </Flex>
      {shouldWrapChildren ? (
        <Box
          mt="1.5rem"
          padding="1.5rem"
          bg="neutral-2"
          borderRadius="0.25rem"
        >
          {children}
        </Box>
      ) : (
        children
      )}
    </Box>
  );
}
