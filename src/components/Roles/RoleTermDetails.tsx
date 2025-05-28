import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Icon,
  Text,
} from '@chakra-ui/react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAddress, Hex } from 'viem';
import { RoleFormTermStatus } from '../../types/roles';
import NoDataCard from '../ui/containers/NoDataCard';
import RoleTerm from './RoleTerm';

type RoleTermDetailProp = {
  nominee: string;
  termEndDate: Date;
  termNumber: number;
};

type CurrentTermProp = RoleTermDetailProp & { isActive: boolean | undefined };

function RoleTermRenderer({
  roleTerm,
  termStatus,
  displayLightContainer,
  hatId,
}: {
  hatId: Hex | undefined;
  roleTerm?: RoleTermDetailProp;
  termStatus: RoleFormTermStatus;
  displayLightContainer?: boolean;
}) {
  if (!roleTerm?.nominee || !roleTerm?.termEndDate) {
    return null;
  }
  return (
    <RoleTerm
      hatId={hatId}
      termNominatedWearer={getAddress(roleTerm.nominee)}
      termEndDate={roleTerm.termEndDate}
      termStatus={termStatus}
      termNumber={roleTerm.termNumber}
      displayLightContainer={displayLightContainer}
    />
  );
}

function RoleTermExpiredTerms({
  hatId,
  roleTerms,
}: {
  hatId: Hex | undefined;
  roleTerms?: RoleTermDetailProp[];
}) {
  const { t } = useTranslation('roles');
  if (!roleTerms?.length) {
    return null;
  }
  return (
    <Box
      borderRadius="0.5rem"
      boxShadow="layeredShadowBorder"
    >
      <Accordion allowToggle>
        <AccordionItem
          borderTop="none"
          borderBottom="none"
          borderTopRadius="0.5rem"
          borderBottomRadius="0.5rem"
        >
          {({ isExpanded }) => (
            <>
              <AccordionButton
                borderTopRadius="0.5rem"
                borderBottomRadius="0.5rem"
                p="1rem"
              >
                <Flex
                  alignItems="center"
                  gap={2}
                >
                  <Icon
                    as={!isExpanded ? CaretDown : CaretRight}
                    boxSize="1.25rem"
                    color="color-lilac-100"
                  />
                  <Text
                    textStyle="text-lg-regular"
                    color="color-lilac-100"
                  >
                    {t('showPreviousTerms')}
                  </Text>
                </Flex>
              </AccordionButton>
              <Flex
                flexDir="column"
                gap={4}
              >
                {roleTerms.map((term, index) => {
                  return (
                    <AccordionPanel
                      key={index}
                      px="1rem"
                    >
                      <RoleTermRenderer
                        key={index}
                        hatId={hatId}
                        roleTerm={term}
                        termStatus={RoleFormTermStatus.Expired}
                        displayLightContainer
                      />
                    </AccordionPanel>
                  );
                })}
              </Flex>
            </>
          )}
        </AccordionItem>
      </Accordion>
    </Box>
  );
}

export default function RoleTermDetails({
  hatId,
  currentTerm,
  nextTerm,
  expiredTerms,
}: {
  hatId: Hex | undefined;
  nextTerm: RoleTermDetailProp | undefined;
  currentTerm: CurrentTermProp | undefined;
  expiredTerms: RoleTermDetailProp[];
}) {
  const currentTermStatus = useMemo(() => {
    if (!!currentTerm) {
      if (!currentTerm.isActive) {
        return RoleFormTermStatus.ReadyToStart;
      }
      return RoleFormTermStatus.Current;
    }
    return RoleFormTermStatus.Pending;
  }, [currentTerm]);

  return (
    <Flex
      flexDir="column"
      gap={4}
    >
      {!currentTerm && (
        <NoDataCard
          translationNameSpace="roles"
          emptyText="noActiveTerms"
          emptyTextNotProposer="noActiveTermsNotProposer"
        />
      )}
      {/* Next Term */}
      <RoleTermRenderer
        hatId={hatId}
        roleTerm={nextTerm}
        termStatus={nextTerm ? RoleFormTermStatus.Queued : RoleFormTermStatus.Pending}
      />
      {/* Current Term */}
      <RoleTermRenderer
        hatId={hatId}
        roleTerm={currentTerm}
        termStatus={currentTermStatus}
      />
      <RoleTermExpiredTerms
        roleTerms={expiredTerms}
        hatId={hatId}
      />
    </Flex>
  );
}
