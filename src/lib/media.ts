declare const process: {
  env?: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

export const getMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isLocal) {
      return cleanPath;
    }
  }
  const backendBase = ((typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return `${backendBase}${cleanPath}`;
};
