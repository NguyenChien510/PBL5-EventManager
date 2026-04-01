import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

const getRedirectPathByRole = (roleName?: string | null) => {
  const normalized = (roleName ?? "").toUpperCase().replace("ROLE_", "");
  switch (normalized) {
    case "ORGANIZER":
      return "/organizer/dashboard";
    case "ADMIN":
      return "/admin/moderation";
    case "USER":
    default:
      return "/";
  }
};

export const GuestRoute = () => {
  const { accessToken, user } = useAuthStore();
  const isAuthenticated = !!accessToken;

  if (isAuthenticated) {
    const roleName = user?.role?.name;
    return <Navigate to={getRedirectPathByRole(roleName)} replace />;
  }

  return <Outlet />;
};
