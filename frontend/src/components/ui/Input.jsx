import React from 'react';

export function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#6B6B67] dark:text-[#AAA79E] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-[#8C8C87]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full bg-[#FFFFFF] dark:bg-[#242422] border border-[#E2DED5] dark:border-[#393833] rounded-lg px-3.5 py-2 text-xs text-[#202124] dark:text-[#F1EFE8] placeholder-[#8C8C87] dark:placeholder-[#7E7B73] focus:outline-none focus:border-[#C45A3C] focus:ring-1 focus:ring-[#C45A3C] transition-colors ${
            Icon ? 'pl-9' : ''
          } ${error ? 'border-[#B34A38] focus:border-[#B34A38] focus:ring-[#B34A38]' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
}
