export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dromlink-production.up.railway.app/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as any),
  };

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('dormlink-auth');
      if (!window.location.pathname.includes('/sign-in')) {
        window.location.href = '/sign-in';
      }
    }
    const errorBody = await response.text();
    let errorMessage = errorBody || 'API request failed';
    try {
      const parsed = JSON.parse(errorBody);
      if (typeof parsed === 'object' && parsed !== null) {
        const values = Object.values(parsed);
        if (values.length > 0) {
          const firstError = values[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      }
    } catch (e) {}
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) return null;
  
  return response.json();
};
