import React, { useEffect, useState, type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { apiClient } from "@/utils/axios";

interface Props {
  children: ReactNode;
}

export const GoogleAuthProviderWrapper: React.FC<Props> = ({ children }) => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const response = await apiClient.get("/public/config/google-client-id");
        if (response.data?.clientId) {
          setClientId(response.data.clientId);
        }
      } catch (error) {
        console.error("Failed to fetch Google Client ID from backend:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientId();
  }, []);

  // While loading config, you can render a full-screen spinner or just the children (but without Google Provider)
  // To keep it simple, we render nothing until we know the client id, assuming it's fast.
  if (loading) {
    return null; 
  }

  // If we couldn't fetch a valid client ID, we provide a placeholder to prevent crashes
  // Google features simply won't work.
  const finalClientId = clientId || "dummy_id";

  return (
    <GoogleOAuthProvider clientId={finalClientId}>
      {children}
    </GoogleOAuthProvider>
  );
};
