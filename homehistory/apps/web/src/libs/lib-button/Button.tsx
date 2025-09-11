import React from 'react';
import clsx from 'clsx';

type LibButtonProps = {
  label: string;
  outlined?: boolean;
  backgroundColor?: string;
  onSubmit: () => void;
  disabled?: boolean;
  hoverColor?: string;
  styleClass?: string;
  padding?: string;
  color?: string;
  bold?: boolean;
  rounded?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const LibButton = ({
  label,
  outlined = false,
  backgroundColor,
  onSubmit,
  disabled = false,
  hoverColor,
  styleClass,
  padding,
  color,
  bold = false,
  rounded = false,
  size = 'md',
}: LibButtonProps) => {
  // Default button sizes
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-w-[60px]',
    md: 'text-sm px-4 py-2 min-w-[80px]',
    lg: 'text-base px-6 py-3 min-w-[100px]',
  };

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      style={{
        backgroundColor: outlined ? 'transparent' : backgroundColor || '#6550b4',
        color: outlined ? color || '#6550b4' : color || '#fff',
        padding: padding || undefined,
        borderColor: outlined ? color || '#6550b4' : 'transparent',
      }}
      className={clsx(
        'inline-flex items-center justify-center rounded-md transition-colors duration-200 focus:outline-none',
        sizeClasses[size],
        styleClass,
        {
          'font-bold': bold,
          'opacity-40 pointer-events-none': disabled,
          border: outlined,
          'rounded-full px-6': rounded,
          'hover:opacity-90': !hoverColor && !outlined,
        }
      )}
      onMouseEnter={(e) => {
        if (hoverColor) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverColor;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = outlined
          ? 'transparent'
          : backgroundColor || '#6550b4';
      }}
    >
      {label}
    </button>
  );
};

export default LibButton;
