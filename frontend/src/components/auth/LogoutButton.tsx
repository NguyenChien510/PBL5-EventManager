import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader } from "@/components/ui/loader";

export const LogoutButton = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isLoading && <Loader className="h-4 w-4 text-white" />}
      {isLoading ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
};
