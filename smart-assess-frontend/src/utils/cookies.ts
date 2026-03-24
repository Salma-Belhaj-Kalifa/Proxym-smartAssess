
interface CookieOptions {
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  expires?: number;
  domain?: string;
}

const DEFAULT_OPTIONS: CookieOptions = {
  path: '/',
  secure: true,
  sameSite: 'strict',
  expires: 7
};

export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (mergedOptions.expires) {
    const date = new Date();
    date.setTime(date.getTime() + (mergedOptions.expires * 24 * 60 * 60 * 1000));
    cookieString += `; expires=${date.toUTCString()}`;
  }
  
  if (mergedOptions.path) {
    cookieString += `; path=${mergedOptions.path}`;
  }
  
  if (mergedOptions.domain) {
    cookieString += `; domain=${mergedOptions.domain}`;
  }
  
  if (mergedOptions.secure) {
    cookieString += '; secure';
  }
  
  if (mergedOptions.sameSite) {
    cookieString += `; samesite=${mergedOptions.sameSite}`;
  }
  
  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = encodeURIComponent(name) + '=';
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  
  return null;
};

export const deleteCookie = (name: string, options: CookieOptions = {}) => {
  setCookie(name, '', { ...options, expires: -1 });
};

export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

export const setJsonCookie = (name: string, value: any, options: CookieOptions = {}) => {
  const jsonString = JSON.stringify(value);
  setCookie(name, jsonString, options);
};


export const getJsonCookie = <T = any>(name: string): T | null => {
  const cookieValue = getCookie(name);
  if (!cookieValue) return null;
  
  try {
    return JSON.parse(cookieValue);
  } catch (error) {
    console.error(`Erreur lors de la lecture du cookie JSON ${name}:`, error);
    return null;
  }
};


export const clearAuthCookies = () => {
  deleteCookie('auth_token');
  deleteCookie('user_data');
  deleteCookie('user_role');
};
