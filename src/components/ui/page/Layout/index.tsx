import { Box, Container, Grid, GridItem } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { CONTENT_HEIGHT, HEADER_HEIGHT } from '../../../../constants/common';
import { ErrorBoundary } from '../../utils/ErrorBoundary';
import { TopErrorFallback } from '../../utils/TopErrorFallback';
import Header from '../Header';
import Navigation from '../Navigation';

export default function Layout() {
  return (
    <Grid
      templateAreas={{
        base: `"nav header"
"main main"`,
        md: `"nav header"
"nav main"`,
      }}
      gridTemplateColumns="4.25rem 1fr"
      gridTemplateRows={`${HEADER_HEIGHT} minmax(${CONTENT_HEIGHT}, 100%)`}
      position="relative"
    >
      <GridItem
        area={'main'}
        mx="1.5rem"
      >
        <Container
          display="grid"
          maxWidth="container.xl"
          px="0"
          minH={CONTENT_HEIGHT}
          paddingBottom="2rem"
        >
          <ErrorBoundary
            fallback={<TopErrorFallback />}
            showDialog
          >
            <Outlet />
          </ErrorBoundary>
        </Container>
      </GridItem>
      <GridItem area={'header'}>
        <Box
          as="header"
          bg="chocolate.900"
          h="4rem"
          position="fixed"
          zIndex={5}
          w="calc(100% - 4.25rem)"
        >
          <Header />
        </Box>
      </GridItem>

      <GridItem
        area={'nav'}
        display="flex"
        flexDirection="column"
        flexGrow="1"
        bg="chocolate.900"
        position="fixed"
        w="4.25rem"
        minHeight={{ base: undefined, md: '100vh' }}
      >
        <Navigation />
      </GridItem>
    </Grid>
  );
}
