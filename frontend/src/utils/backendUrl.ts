import { API_BASE_URL } from "@/constants";

export const getBackendOriginUrl = () =>
  API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export const buildBackendUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendOriginUrl()}${normalizedPath}`;
};

export const resolveBackendAssetUrl = (url?: string | null) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return buildBackendUrl(url);
};
