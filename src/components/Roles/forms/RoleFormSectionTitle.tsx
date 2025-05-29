import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { ArrowUpRight, Info } from '@phosphor-icons/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TOOLTIP_MAXW } from '../../../constants/common';
import ExternalLink from '../../ui/links/ExternalLink';
import ModalTooltip from '../../ui/modals/ModalTooltip';

export function SectionTitle({
  title,
  externalLink,
  tooltipContent,
}: {
  title: string;
  externalLink?: string;
  tooltipContent: string;
}) {
  const { t } = useTranslation(['common']);
  const titleRef = useRef<HTMLDivElement>(null);
  return (
    <Flex flexDir="column">
      <Flex
        justifyContent="space-between"
        alignItems="center"
      >
        <Box
          ref={titleRef}
          zIndex={1}
        >
          <ModalTooltip
            containerRef={titleRef}
            maxW={TOOLTIP_MAXW}
            label={tooltipContent}
            isDisabled={!tooltipContent}
          >
            <Flex
              alignItems="center"
              gap="0.25rem"
            >
              <Text
                textStyle="text-xl-regular"
                color="color-white"
              >
                {title}
              </Text>
              {tooltipContent && (
                <Icon
                  as={Info}
                  color="color-lilac-100"
                />
              )}
            </Flex>
          </ModalTooltip>
        </Box>
        {externalLink && (
          <ExternalLink href={externalLink}>
            <Flex
              alignItems="center"
              gap="0.25rem"
            >
              <Text textStyle="text-xs-medium">{t('learnMore')}</Text>
              <Icon
                as={ArrowUpRight}
                boxSize="1rem"
              />
            </Flex>
          </ExternalLink>
        )}
      </Flex>
    </Flex>
  );
}
