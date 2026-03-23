// Utils pour gérer les cookies de manière sécurisée

// Interface pour les options de cookies
interface CookieOptions {
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  expires?: number;
  domain?: string;
}

// Options par défaut pour les cookies
const DEFAULT_OPTIONS: CookieOptions = {
  path: '/',
  secure: true,
  sameSite: 'strict',
  // Les cookies expirent après 7 jours par défaut
  expires: 7
};

/**
 * Définit un cookie avec des options de sécurité
 */
export const setCookie = (name: string, value: string, options: CookieOptions = {}) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  // Ajouter les options
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

/**
 * Récupère la valeur d'un cookie
 */
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

/**
 * Supprime un cookie
 */
export const deleteCookie = (name: string, options: CookieOptions = {}) => {
  setCookie(name, '', { ...options, expires: -1 });
};

/**
 * Vérifie si un cookie existe
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Stocke des données JSON dans un cookie
 */
export const setJsonCookie = (name: string, value: any, options: CookieOptions = {}) => {
  const jsonString = JSON.stringify(value);
  setCookie(name, jsonString, options);
};

/**
 * Récupère des données JSON depuis un cookie
 */
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

/**
 * Nettoie tous les cookies d'authentification
 */
export const clearAuthCookies = () => {
  deleteCookie('auth_token');
  deleteCookie('user_data');
  deleteCookie('user_role');
};
