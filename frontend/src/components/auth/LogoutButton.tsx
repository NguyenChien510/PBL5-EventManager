import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";

export const LogoutButton = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/signin");
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 flex items-center justify-center gap-2"
    >
      Đăng xuất
    </button>
  );
};
