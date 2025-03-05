import { wrapCreateBrowserRouter } from '@sentry/react';
import { createBrowserRouter, redirect } from 'react-router-dom';
import { ModalProvider } from './components/ui/modals/ModalProvider';
import { Global } from './components/ui/page/Global';
import { BASE_ROUTES, DAO_ROUTES } from './constants/routes';
import FourOhFourPage from './pages/404';
import LoadingProblem from './pages/LoadingProblem';
import { SafeCreatePage } from './pages/create/SafeCreatePage';
import { SafeController } from './pages/dao/SafeController';
import { SafeDashboardPage } from './pages/dao/SafeDashboardPage';
import { SafeEditGovernancePage } from './pages/dao/edit/governance/SafeEditGovernancePage';
import { SafeHierarchyPage } from './pages/dao/hierarchy/SafeHierarchyPage';
import { SafeSubDaoCreatePage } from './pages/dao/new/SafeSubDaoCreatePage';
import { SafeProposalTemplatesPage } from './pages/dao/proposal-templates/SafeProposalTemplatesPage';
import { SafeCreateProposalTemplatePage } from './pages/dao/proposal-templates/new/SafeCreateProposalTemplatePage';
import { SafeProposalDetailsPage } from './pages/dao/proposals/[proposalId]';
import { SafeProposalWithActionsCreatePage } from './pages/dao/proposals/actions/new/SafeProposalWithActionsCreatePage';
import { SafeProposalCreatePage } from './pages/dao/proposals/new/SafeProposalCreatePage';
import { SafeSablierProposalCreatePage } from './pages/dao/proposals/new/sablier/SafeSablierProposalCreatePage';
import { SafeRolesPage } from './pages/dao/roles/SafeRolesPage';
import { SafeRoleDetailsPage } from './pages/dao/roles/details/SafeRoleDetailsPage';
import SafeRolesEditFormikPageWrapper from './pages/dao/roles/edit/SafeRolesEditFormikPageWrapper';
import { SafeRolesEditPage } from './pages/dao/roles/edit/SafeRolesEditPage';
import { SafeRoleEditDetailsPage } from './pages/dao/roles/edit/details/SafeRoleEditDetailsPage';
import { SafeRolesEditProposalSummaryPage } from './pages/dao/roles/edit/summary/SafeRolesEditProposalSummaryPage';
import { SafeSettingsPage } from './pages/dao/settings/SafeSettingsPage';
import { SafeGeneralSettingsPage } from './pages/dao/settings/general/SafeGeneralSettingsPage';
import { SafeGovernanceSettingsPage } from './pages/dao/settings/governance/SafeGovernanceSettingsPage';
import { SafeModulesSettingsPage } from './pages/dao/settings/modules-and-guard/SafeModulesSettingsPage';
import { SafePermissionsCreateProposal } from './pages/dao/settings/permissions/SafePermissionsCreateProposal';
import { SafePermissionsSettingsPage } from './pages/dao/settings/permissions/SafePermissionsSettingsPage';
import { SafeTreasuryPage } from './pages/dao/treasury/SafeTreasuryPage';
import HomePage from './pages/home/HomePage';

interface LoaderFunctionArgs {
  request: Request;
}
export const router = (addressPrefix: string, daoAddress: string | undefined) =>
  wrapCreateBrowserRouter(createBrowserRouter)([
    {
      path: '/',
      element: (
        // We're placing ModalProvider here instead of src/providers/Providers.tsx due to the need of having router context
        // within underlying modals. Otherwise - trying to invoke routing-related hooks would lead to crash.
        // Not the best place to have this provider here but also more reasonalbe than putting that into <Layout />
        <ModalProvider>
          <Global />
        </ModalProvider>
      ),
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: 'create/*',
          element: <SafeCreatePage />,
        },
        {
          path: 'create',
          loader: () => redirect(BASE_ROUTES.create),
        },
        {
          path: '/',
          element: <SafeController />,
          // @dev handles redirect when dao address query is missing from URL
          loader: ({ request }: LoaderFunctionArgs) => {
            const url = new URL(request.url);
            const searchParams = new URLSearchParams(url.search);
            const daoAddressWithPrefix = searchParams.get('dao');
            if (!daoAddressWithPrefix) {
              return <LoadingProblem type="badQueryParam" />;
            }
            return null;
          },
          children: [
            {
              path: DAO_ROUTES.dao.path,
              element: <SafeDashboardPage />,
            },
            {
              path: 'edit/governance/*',
              element: <SafeEditGovernancePage />,
            },
            {
              path: 'edit/governance',
              loader: () =>
                redirect(
                  daoAddress
                    ? DAO_ROUTES.modifyGovernance.relative(addressPrefix, daoAddress)
                    : BASE_ROUTES.landing,
                ),
            },
            {
              path: DAO_ROUTES.hierarchy.path,
              element: <SafeHierarchyPage />,
            },
            {
              path: DAO_ROUTES.roles.path,
              children: [
                {
                  index: true,
                  element: <SafeRolesPage />,
                },
                {
                  path: 'details',
                  element: <SafeRoleDetailsPage />,
                },
              ],
            },
            {
              path: DAO_ROUTES.rolesEdit.path,
              element: <SafeRolesEditFormikPageWrapper />,
              children: [
                {
                  index: true,
                  element: <SafeRolesEditPage />,
                },
                {
                  path: 'details',
                  element: <SafeRoleEditDetailsPage />,
                },
                {
                  path: 'summary',
                  element: <SafeRolesEditProposalSummaryPage />,
                },
              ],
            },
            {
              path: 'new/*',
              element: <SafeSubDaoCreatePage />,
            },
            {
              path: 'new',
              loader: () =>
                redirect(
                  daoAddress
                    ? DAO_ROUTES.newSubDao.relative(addressPrefix, daoAddress)
                    : BASE_ROUTES.landing,
                ),
            },
            {
              path: 'proposal-templates',
              children: [
                {
                  index: true,
                  element: <SafeProposalTemplatesPage />,
                },
                {
                  path: 'new',
                  element: <SafeCreateProposalTemplatePage />,
                },
              ],
            },
            {
              path: DAO_ROUTES.proposals.path,
              children: [
                {
                  index: true,
                  loader: () =>
                    redirect(
                      daoAddress
                        ? DAO_ROUTES.dao.relative(addressPrefix, daoAddress)
                        : BASE_ROUTES.landing,
                    ),
                },
                {
                  path: ':proposalId',
                  element: <SafeProposalDetailsPage />,
                },
                {
                  path: 'new',
                  element: <SafeProposalCreatePage />,
                },
                {
                  path: 'actions/new',
                  element: <SafeProposalWithActionsCreatePage />,
                },
                {
                  path: 'new/sablier',
                  element: <SafeSablierProposalCreatePage />,
                },
              ],
            },
            {
              path: DAO_ROUTES.settings.path,
              element: <SafeSettingsPage />,
              children: [
                {
                  index: true,
                  element: <SafeGeneralSettingsPage />,
                },
                {
                  path: DAO_ROUTES.settingsGeneral.path,
                  element: <SafeGeneralSettingsPage />,
                },
                {
                  path: DAO_ROUTES.settingsGovernance.path,
                  element: <SafeGovernanceSettingsPage />,
                },
                {
                  path: DAO_ROUTES.settingsModulesAndGuard.path,
                  element: <SafeModulesSettingsPage />,
                },
                {
                  path: DAO_ROUTES.settingsPermissions.path,
                  element: <SafePermissionsSettingsPage />,
                  children: [
                    {
                      path: DAO_ROUTES.settingsPermissionsCreateProposal.path,
                      element: <SafePermissionsCreateProposal />,
                    },
                  ],
                },
              ],
            },
            {
              path: DAO_ROUTES.treasury.path,
              element: <SafeTreasuryPage />,
            },
          ],
        },
        {
          // this exists to keep old links working
          // /daos/0x0123/* will redirect to /home?dao=0x0123
          path: 'daos/:legacyDaoAddress/*',
          loader: ({ params: { legacyDaoAddress } }: { params: { legacyDaoAddress: string } }) =>
            redirect(DAO_ROUTES.dao.relative(addressPrefix, legacyDaoAddress)),
        },
        {
          path: '*', // 404
          element: <FourOhFourPage />,
        },
      ],
    },
  ]);
