export const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export const apiPost = async (path, body) => {
  if (!API_BASE) {
    throw new Error('Backend URL is not configured.');
  }
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API request failed');
  }
  
  return response.json();
};

export const apiGet = async (path) => {
  if (!API_BASE) {
    throw new Error('Backend URL is not configured.');
  }
  const url = `${API_BASE}${path}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API request failed');
  }
  
  return response.json();
};
