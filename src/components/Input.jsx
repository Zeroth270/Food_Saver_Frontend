import React from 'react';

const Input = ({ label, type = 'text', id, error, className = '', ...props }) => {
    return (
        <div className={`flex flex-col gap-1 mb-4 ${className}`}>
            {label && <label htmlFor={id} className="font-semibold text-sm text-text-main">{label}</label>}
            {type === 'textarea' ? (
                <textarea
                    id={id}
                    className={`p-3 rounded-md border text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 min-h-[120px] resize-y w-full ${error ? 'border-danger' : 'border-border'}`}
                    {...props}
                />
            ) : (
                <input
                    type={type}
                    id={id}
                    className={`p-3 rounded-md border text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 w-full ${error ? 'border-danger' : 'border-border'}`}
                    {...props}
                />
            )}
            {error && <span className="text-danger text-sm">{error}</span>}
        </div>
    );
};

export default Input;
