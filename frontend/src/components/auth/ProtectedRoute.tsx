import { useAuthStore } from "@/stores/useAuthStore";
import { Navigate, Outlet } from "react-router-dom";
import { Loader } from "@/components/ui/loader";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { accessToken, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }

  const roleName = (user?.role?.name ?? '').toUpperCase().replace('ROLE_', '');

  if (allowedRoles && allowedRoles.length > 0) {
    // ADMIN has full access, otherwise check if role is in allowedRoles
    if (roleName !== 'ADMIN' && !allowedRoles.includes(roleName)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};
