import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C45A3C] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs font-semibold gap-2",
    lg: "px-5 py-2.5 text-sm font-semibold gap-2.5"
  };

  const variantStyles = {
    primary: "bg-[#C45A3C] hover:bg-[#B34F33] dark:bg-[#D06A4A] dark:hover:bg-[#C45A3C] text-white border border-[#B34F33] dark:border-[#C45A3C] shadow-subtle",
    secondary: "bg-[#FFFFFF] dark:bg-[#242422] hover:bg-[#EFECE4] dark:hover:bg-[#2A2A28] text-[#202124] dark:text-[#F1EFE8] border border-[#E2DED5] dark:border-[#393833] shadow-subtle",
    accent: "bg-[#68735B] hover:bg-[#58624D] dark:bg-[#7E8A70] dark:hover:bg-[#68735B] text-white border border-[#58624D] shadow-subtle",
    outline: "bg-transparent hover:bg-[#EFECE4]/50 dark:hover:bg-[#2A2A28] text-[#202124] dark:text-[#F1EFE8] border border-[#E2DED5] dark:border-[#393833]",
    ghost: "bg-transparent hover:bg-[#EFECE4]/60 dark:hover:bg-[#242422] text-[#6B6B67] hover:text-[#202124] dark:text-[#AAA79E] dark:hover:text-[#F1EFE8]",
    danger: "bg-[#B34A38] hover:bg-[#9E3E2E] text-white border border-[#9E3E2E] shadow-subtle"
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
