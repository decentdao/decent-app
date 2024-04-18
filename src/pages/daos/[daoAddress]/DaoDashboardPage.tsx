import { Box } from '@chakra-ui/react';
import { Activities } from '../../../components/pages/DaoDashboard/Activities';
import { ERCO20Claim } from '../../../components/pages/DaoDashboard/ERC20Claim';
import { DaoInfoHeader } from '../../../components/pages/DaoDashboard/Info/DaoInfoHeader';
import InfoHeader from '../../../components/pages/DaoDashboard/Info/InfoHeader';
import useDAOMetadata from '../../../hooks/DAO/useDAOMetadata';

export default function DaoDashboardPage() {
  const daoMetadata = useDAOMetadata();

  return (
    <>
      <InfoHeader />
      <Box mt={!!daoMetadata ? 40 : 12}>
        <DaoInfoHeader />
        <ERCO20Claim />
        <Activities />
      </Box>
    </>
  );
}
