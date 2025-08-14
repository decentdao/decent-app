import { useSearchParams } from 'react-router-dom';
import RolesDetails from '../../../../components/Roles/RoleDetails';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';

export function SafeRoleDetailsPage() {
  const { safeAddress, daoKey } = useCurrentDAOKey();

  const {
    roles: { hatsTree },
  } = useDAOStore({ daoKey });
  const [searchParams] = useSearchParams();
  const hatId = searchParams.get('hatId');
  const roleHat = hatsTree?.roleHats.find(hat => hat.id === hatId);

  // @todo add logic for loading
  // @todo add redirect for hat not found
  if (!roleHat || !safeAddress) return null;

  return <RolesDetails roleHat={{ ...roleHat, wearer: roleHat.wearerAddress }} />;
}
