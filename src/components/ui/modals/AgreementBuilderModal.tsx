import { Button, Flex, IconButton, Text } from '@chakra-ui/react';
import { X } from '@phosphor-icons/react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import Divider from '../utils/Divider';

function Header({ closeModal }: { closeModal: () => void }) {
  const { t } = useTranslation(['agreements', 'common']);

  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      mb="1rem"
    >
      <Text textStyle="text-xl-regular">{t('agreementBuilderTitle')}</Text>
      <IconButton
        as={X}
        variant="tertiary"
        cursor="pointer"
        boxSize="1rem"
        color="color-neutral-50"
        aria-label={t('close', { ns: 'common' })}
        onClick={closeModal}
      />
    </Flex>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      color="color-neutral-50"
      textStyle="text-sm-regular"
    >
      {title}
    </Text>
  );
}

export function AgreementBuilderModal({ closeModal }: { closeModal: () => void }) {
  const { t } = useTranslation(['agreements', 'common']);

  return (
    <Formik
      validationSchema={{}}
      initialValues={{}}
      onSubmit={() => {}}
    >
      {formikProps => {
        console.log('🚀 ~ Removing later, so linter doe not yell', formikProps);
        return (
          <>
            <Header closeModal={closeModal} />

            <SectionTitle title={t('agreementBuilderSectionTitleNewDeal')} />
            {/* TODO: New Deal Form */}
            <Divider my="1rem" />
            <SectionTitle title={t('agreementBuilderSectionTitleCounterparties')} />
            {/* TODO: Counterparties Form */}
            <Divider my="1rem" />
            {/* TODO: LOCKUP Checkbox */}
            {/* TODO: Date Input  */}

            <Flex
              justifyContent="flex-end"
              mt="1rem"
              gap="1rem"
            >
              <Button
                variant="secondary"
                onClick={closeModal}
              >
                {t('agreementBuilderDiscard')}
              </Button>
              <Button type="submit">{t('agreementBuilderProposeAgreement')}</Button>
            </Flex>
          </>
        );
      }}
    </Formik>
  );
}
