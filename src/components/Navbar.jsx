import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Leaf, Sun, Moon, User, LogOut, ChevronDown, Bell } from 'lucide-react';
import Button from './Button';
import NotificationBell from './NotificationBell';
import { isLoggedIn, logout, getUser } from '../utils/auth';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const loggedIn = isLoggedIn();
    const user = loggedIn ? getUser() : null;
    const { darkMode, toggleTheme } = useTheme();
    const dropdownRef = useRef(null);

    const toggleMenu = () => setIsOpen(!isOpen);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setDropdownOpen(false);
        setIsOpen(false);
    }, [location.pathname]);

    const userRole = user?.role?.toUpperCase();
    const isDonor = userRole === 'DONOR';

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Discover', path: '/discover' },
        ...(loggedIn && isDonor ? [
            { name: 'Post Food', path: '/post-food' },
            { name: 'My Posts', path: '/my-posts' },
        ] : []),
        ...(loggedIn ? [
            { name: 'Messages', path: '/messages' },
        ] : []),
    ];

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        setDropdownOpen(false);
        navigate('/');
    };

    const getLinkClass = (path) => {
        const base = "px-4 py-2 rounded-md transition-colors duration-150";
        const active = "text-primary font-semibold";
        const inactive = "text-text-main font-normal hover:text-primary";
        return `${base} ${location.pathname === path ? active : inactive}`;
    };

    const userName = user?.name || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

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

                    {/* Notifications + User Dropdown */}
                    {loggedIn && (
                        <li>
                            <NotificationBell />
                        </li>
                    )}
                    <li>
                        {loggedIn ? (
                            <div className="relative" ref={dropdownRef}>
                                {/* Avatar trigger */}
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-border/60 transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {userInitial}
                                    </div>
                                    <span className="text-sm font-medium text-text-main hidden lg:inline max-w-[100px] truncate">
                                        {userName}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className={`text-text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-52 bg-surface rounded-xl shadow-xl border border-border overflow-hidden animate-dropdown z-[100]">
                                        {/* User info header */}
                                        <div className="px-4 py-3 border-b border-border bg-background/50">
                                            <p className="text-sm font-semibold text-text-main truncate">{userName}</p>
                                            {user?.email && (
                                                <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>
                                            )}
                                        </div>

                                        {/* Menu items */}
                                        <div className="py-1">
                                            <Link
                                                to="/profile"
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main hover:bg-primary/5 hover:text-primary transition-colors duration-150 cursor-pointer"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <User size={16} />
                                                Profile
                                            </Link>
                                            <div className="border-t border-border my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-150 w-full text-left cursor-pointer"
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Log In</Button>
                                </Link>
                                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                                    Sign Up
                                </Button>
                            </div>
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
                            <>
                                {/* Mobile user info */}
                                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {userInitial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-text-main truncate">{userName}</p>
                                        {user?.email && (
                                            <p className="text-xs text-text-muted truncate">{user.email}</p>
                                        )}
                                    </div>
                                </div>
                                <Link
                                    to="/profile"
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-text-main hover:bg-primary/5 hover:text-primary transition-colors border border-border"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <User size={16} />
                                    Profile
                                </Link>
                                <Button variant="ghost" size="md" className="w-full !text-red-500" onClick={handleLogout}>
                                    <LogOut size={16} className="mr-2" />
                                    Logout
                                </Button>
                            </>
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

            {/* Dropdown Animation */}
            <style>{`
                .animate-dropdown {
                    animation: dropdownIn 0.18s ease-out;
                    transform-origin: top right;
                }
                @keyframes dropdownIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;

