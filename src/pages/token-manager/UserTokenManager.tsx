import { useEffect } from 'react';
import { redirect } from 'react-router-dom';
import { toast } from 'sonner';
import { BASE_ROUTES } from '../../constants/routes';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';

export function UserTokenManagerPage() {
  const isRevShareEnabled = useFeatureFlag('flag_revenue_sharing');
  useEffect(() => {
    if (!isRevShareEnabled) {
      toast.warning('Revenue sharing is not available yet. Have some patience, jeez.');
      redirect(BASE_ROUTES.landing);
    }
  }, [isRevShareEnabled]);

  return <div>TODO: The list of user tokens available for user token management</div>;
}
