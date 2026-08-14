export const getMediaUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("/uploads")) {
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
    return `${backendBase}${url}`;
  }
  return url;
};
