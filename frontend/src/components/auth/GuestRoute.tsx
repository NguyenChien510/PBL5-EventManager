import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { getRedirectPathByRole } from '@/utils/redirect';

export const GuestRoute = () => {
  const { accessToken, user } = useAuthStore();
  const isAuthenticated = !!accessToken;

  if (isAuthenticated) {
    const roleName = user?.role?.name;
    return <Navigate to={getRedirectPathByRole(roleName)} replace />;
  }

  return <Outlet />;
};
