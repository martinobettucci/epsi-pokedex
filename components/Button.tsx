// components/Button.tsx

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  ...rest
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all ease-in-out duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-75 relative group';
  
  const variantStyles = {
    primary: 'bg-indigo-700 text-white hover:bg-indigo-600 focus:ring-indigo-400 disabled:bg-indigo-900 disabled:text-gray-500 hover:shadow-lg hover:shadow-indigo-500/30',
    secondary: 'bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-800 disabled:text-gray-500 hover:shadow-lg hover:shadow-gray-700/30',
    danger: 'bg-red-700 text-white hover:bg-red-600 focus:ring-red-400 disabled:bg-red-900 disabled:text-gray-500 hover:shadow-lg hover:shadow-red-500/30',
    ghost: 'text-indigo-400 hover:bg-gray-800 focus:ring-gray-600 disabled:text-gray-600 hover:shadow-md hover:shadow-indigo-400/20',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedStyles}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;