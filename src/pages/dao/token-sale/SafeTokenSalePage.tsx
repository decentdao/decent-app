import { Box } from '@chakra-ui/react';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW } from '../../../constants/common';

export function SafeTokenSalePage() {
  return (
    <Box
      mt={12}
      maxW={CONTENT_MAXW}
    >
      <PageHeader
        title="Token Sale"
        breadcrumbs={[
          {
            terminus: 'Token Sale',
            path: '',
          },
        ]}
      />
      {/* Token Sale content will be implemented here */}
    </Box>
  );
}
