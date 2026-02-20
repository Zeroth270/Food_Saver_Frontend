import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Leaf } from 'lucide-react';
import Button from './Button';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Discover', path: '/discover' },
        { name: 'Post Food', path: '/post-food' },
    ];

    const getLinkClass = (path) => {
        const base = "px-4 py-2 rounded-md transition-colors duration-150";
        const active = "text-primary font-semibold";
        const inactive = "text-text-main font-normal hover:text-primary";
        return `${base} ${location.pathname === path ? active : inactive}`;
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm py-4">
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
                    <li className="flex gap-2">
                        <Link to="/login">
                            <Button variant="ghost" size="sm">Log In</Button>
                        </Link>
                        <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                            Sign Up
                        </Button>
                    </li>
                </ul>

                {/* Mobile Toggle */}
                <button className="md:hidden text-text-main block" onClick={toggleMenu}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white p-4 shadow-md flex flex-col gap-4 border-t border-border z-[999]">
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
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" size="md" className="w-full">Log In</Button>
                        </Link>
                        <Button variant="primary" size="md" className="w-full" onClick={() => {
                            navigate('/signup');
                            setIsOpen(false);
                        }}>
                            Sign Up
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
