import { useAuthStore } from "@/stores/useAuthStore";
import { LogoutButton } from "@/components/auth";

const labelClass = "text-sm text-gray-500";
const valueClass = "text-base text-gray-900";

const UserProfilePage = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h1 className="text-xl font-semibold text-gray-900">
            Thong tin nguoi dung
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Khong co du lieu nguoi dung. Hay dang nhap lai.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Thong tin nguoi dung
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Thong tin tai khoan dang nhap hien tai.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-4 mt-6">
          <div>
            <p className={labelClass}>Ho ten</p>
            <p className={valueClass}>{user.fullName}</p>
          </div>
          <div>
            <p className={labelClass}>Email</p>
            <p className={valueClass}>{user.email}</p>
          </div>
          <div>
            <p className={labelClass}>User ID</p>
            <p className={valueClass}>{user.id}</p>
          </div>
          {user.role?.name && (
            <div>
              <p className={labelClass}>Role</p>
              <p className={valueClass}>{user.role.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
