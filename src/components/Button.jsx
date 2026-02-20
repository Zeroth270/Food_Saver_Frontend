import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 cursor-pointer border focus:outline-none';

    const variants = {
        primary: 'bg-primary text-white border-transparent shadow-md hover:bg-primary-dark',
        secondary: 'bg-secondary text-text-main border-transparent shadow-md hover:bg-secondary-dark',
        outline: 'bg-transparent border-primary text-primary hover:bg-primary/10',
        ghost: 'bg-transparent border-transparent text-text-light hover:bg-gray-100',
    };

    const sizes = {
        sm: 'px-4 py-1.5 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
