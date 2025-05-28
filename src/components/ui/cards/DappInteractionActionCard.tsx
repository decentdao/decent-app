import { Button, Card, Flex, Icon } from '@chakra-ui/react';
import { ArrowsDownUp, Trash } from '@phosphor-icons/react';
import { CreateProposalAction } from '../../../types';

export function DappInteractionActionCard({
  action,
  onRemove,
}: {
  action: CreateProposalAction;
  onRemove: () => void;
}) {
  return (
    <Card my="0.5rem">
      <Flex justifyContent="space-between">
        <Flex
          alignItems="center"
          gap="0.5rem"
        >
          <Icon
            as={ArrowsDownUp}
            w="1.5rem"
            h="1.5rem"
            color="color-lilac-100"
          />
          {action.content}
        </Flex>
        <Button
          color="color-error-500"
          variant="tertiary"
          size="sm"
          onClick={onRemove}
        >
          <Icon as={Trash} />
        </Button>
      </Flex>
    </Card>
  );
}
