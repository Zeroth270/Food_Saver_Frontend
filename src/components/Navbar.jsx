import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Leaf, Sun, Moon } from 'lucide-react';
import Button from './Button';
import NotificationBell from './NotificationBell';
import { isLoggedIn, logout } from '../utils/auth';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const loggedIn = isLoggedIn();
    const { darkMode, toggleTheme } = useTheme();

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Discover', path: '/discover' },
        ...(loggedIn ? [
            { name: 'Post Food', path: '/post-food' },
            { name: 'My Posts', path: '/my-posts' },
            { name: 'Messages', path: '/messages' },
            { name: 'Profile', path: '/profile' },
        ] : []),
    ];

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/');
    };

    const getLinkClass = (path) => {
        const base = "px-4 py-2 rounded-md transition-colors duration-150";
        const active = "text-primary font-semibold";
        const inactive = "text-text-main font-normal hover:text-primary";
        return `${base} ${location.pathname === path ? active : inactive}`;
    };

    return (
        <nav className="sticky top-0 z-50 bg-nav-bg backdrop-blur-sm shadow-sm py-4 transition-colors duration-300">
            <div className="container flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-dark">
                    <Leaf size={24} className="text-primary" />
                    <span>FoodShare Connect</span>
                </Link>

                {/* Desktop Menu */}
                <ul className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <li key={link.name}>
                            <Link to={link.path} className={getLinkClass(link.path)}>
                                {link.name}
                            </Link>
                        </li>
                    ))}

                    {/* Theme Toggle */}
                    <li>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-text-main hover:bg-border transition-colors duration-200"
                            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </li>

                    {/* Notifications */}
                    {loggedIn && (
                        <li>
                            <NotificationBell />
                        </li>
                    )}

                    <li className="flex gap-2">
                        {loggedIn ? (
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                Logout
                            </Button>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Log In</Button>
                                </Link>
                                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                                    Sign Up
                                </Button>
                            </>
                        )}
                    </li>
                </ul>

                {/* Mobile Toggle */}
                <div className="md:hidden flex items-center gap-2">
                    {loggedIn && <NotificationBell />}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-text-main hover:bg-border transition-colors duration-200"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="text-text-main block" onClick={toggleMenu}>
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-surface p-4 shadow-md flex flex-col gap-4 border-t border-border z-[999] transition-colors duration-300">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`${getLinkClass(link.path)} w-full text-center block`}
                            onClick={() => setIsOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-2 pt-2 border-t border-border">
                        {loggedIn ? (
                            <Button variant="ghost" size="md" className="w-full" onClick={handleLogout}>
                                Logout
                            </Button>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsOpen(false)}>
                                    <Button variant="ghost" size="md" className="w-full">Log In</Button>
                                </Link>
                                <Button variant="primary" size="md" className="w-full" onClick={() => {
                                    navigate('/signup');
                                    setIsOpen(false);
                                }}>
                                    Sign Up
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
