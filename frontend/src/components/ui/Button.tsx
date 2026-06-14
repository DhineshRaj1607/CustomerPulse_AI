import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-black font-bold border-transparent hover:bg-[#22ebd9] shadow-sm hover:shadow-[0_4px_20px_rgba(0,217,163,0.25)]',
  secondary: 'bg-white/[0.04] text-white border border-white/5 hover:bg-white/[0.08]',
  outline: 'bg-transparent text-white border border-white/10 hover:border-accent hover:text-accent hover:bg-accent/5',
  ghost: 'bg-transparent text-white/70 border border-transparent hover:text-white hover:bg-white/[0.03]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-xs rounded-xl',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(91,46,232,0.24)] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
