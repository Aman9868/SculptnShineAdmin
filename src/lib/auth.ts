import Cookies from 'js-cookie';

const TOKEN_KEY = 'admin_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

export const setTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set(TOKEN_KEY, accessToken, { expires: 1, secure: process.env.NODE_ENV === 'production' }); // 1 day (matches JWT_EXPIRES_IN=24h)
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7, secure: process.env.NODE_ENV === 'production' }); // 7 days
};

export const getToken = () => {
  return Cookies.get(TOKEN_KEY);
};

export const getRefreshToken = () => {
  return Cookies.get(REFRESH_TOKEN_KEY);
};

export const removeTokens = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};
