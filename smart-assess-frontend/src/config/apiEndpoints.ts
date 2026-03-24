export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  
  POSITIONS: {
    BASE: '/positions',
    GET_ALL: '/positions',
    GET_PUBLIC: '/positions/public',
    CREATE: '/positions',
    UPDATE: (id: number) => `/positions/${id}`,
    DELETE: (id: number) => `/positions/${id}`,
    BY_ID: (id: number) => `/positions/${id}`,
    TOGGLE_STATUS: (id: number) => `/positions/${id}/status`
  },
  
  CANDIDATES: {
    BASE: '/candidates',
    GET_ALL: '/candidates',
    CREATE: '/candidates',
    GET_BY_ID: (id: number) => `/candidates/${id}`,
    UPDATE: (id: number) => `/candidates/${id}`,
    DELETE: (id: number) => `/candidates/${id}`,
    DELETE_ME: '/candidates/me',
    PROFILE: (id: number) => `/candidates/${id}/profile`,
    CV_UPLOAD: '/candidates/cv'
  },

  CANDIDATURES: {
    BASE: '/candidatures',
    GET_ALL: '/candidatures',
    CREATE: '/candidatures',
    GET_BY_ID: (id: number) => `/candidatures/${id}`,
    UPDATE: (id: number) => `/candidatures/${id}`,
    DELETE: (id: number) => `/candidatures/${id}`,
    BY_CANDIDATE: (candidateId: number) => `/candidatures/candidate/${candidateId}`,
    BY_POSITION: (positionId: number) => `/candidatures/position/${positionId}`,
    UPDATE_STATUS: (id: number) => `/candidatures/${id}/status`
  },
  
  USERS: {
    BASE: '/users',
    GET_BY_ID: (id: number) => `/users/${id}`,
    GET_BY_EMAIL: (email: string) => `/users/email/${email}`,
    GET_BY_ROLE: (role: string) => `/users/role/${role}`,
    PROFILE: (id: number) => `/users/${id}/profile`,
    CHANGE_PASSWORD: (id: number) => `/users/${id}/change-password`,
    DELETE: (id: number) => `/users/${id}`
  },
  
  MANAGERS: {
    BASE: '/managers',
    GET_ALL: '/managers',
    CREATE: '/managers',
    GET_BY_ID: (id: number) => `/managers/${id}`,
    UPDATE: (id: number) => `/managers/${id}`,
    DELETE: (id: number) => `/managers/${id}`,
    DELETE_ME: '/managers/me'
  },
  
  HR: {
    BASE: '/hr',
    GET_ALL: '/hr',
    CREATE: '/hr',
    GET_BY_ID: (id: number) => `/hr/${id}`,
    UPDATE: (id: number) => `/hr/${id}`,
    DELETE: (id: number) => `/hr/${id}`
  },
  
  TESTS: {
    BASE: '/tests',
    GET_ALL: '/tests',
    CREATE: '/tests',
    GET_BY_ID: (id: number) => `/tests/${id}`,
    UPDATE: (id: number) => `/tests/${id}`,
    DELETE: (id: number) => `/tests/${id}`,
    QUESTIONS: (id: number) => `/tests/${id}/questions`,
    GENERATE: '/tests/generate',
    SEND_EMAIL: (id: number) => `/tests/${id}/send-email`,
    SUBMIT: (id: number) => `/tests/${id}/submit`,
    START_TEST: (token: string) => `/tests/public/${token}/start`
  },
  
  CV: {
    UPLOAD: '/candidates/cv',
    ANALYZE: '/cv/analyse',
    DOWNLOAD: (id: number) => `/cv/${id}`
  },
  
  HEALTH: {
    CHECK: '/health'
  }
};

export default API_ENDPOINTS;
