const API_CONFIG = {
  // Use production URL if in production, otherwise fallback to localhost
  BASE_URL: import.meta.env.VITE_API_URL || 'https://chatapp-back-3pmd.onrender.com',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://chatapp-back-3pmd.onrender.com'
};

export default API_CONFIG;
