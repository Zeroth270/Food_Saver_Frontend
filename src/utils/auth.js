export const isLoggedIn = () =>
    !!localStorage.getItem('token') || localStorage.getItem('loggedIn') === 'true';

export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loggedIn');
};
