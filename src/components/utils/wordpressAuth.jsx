// WordPress authentication utilities

export const getWordPressUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error loading WordPress user:', error);
    return null;
  }
};

export const getWordPressToken = () => {
  return localStorage.getItem('wordpress_token');
};

export const isAuthenticated = () => {
  return !!getWordPressToken() && !!getWordPressUser();
};

export const logout = () => {
  localStorage.removeItem('wordpress_token');
  localStorage.removeItem('user_data');
  window.location.href = '/';
};