/**
 * Mobile-optimized UI components with touch-friendly interactions
 */

'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { isTouchDevice } from '@/lib/utils/responsive';

/**
 * Touch-optimized button with large tap target (min 44x44px)
 */
interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
}

export function TouchButton({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...props
}: TouchButtonProps) {
  const baseClasses =
    'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    success: 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-lg hover:shadow-xl',
    danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg hover:shadow-xl',
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-sm min-h-[44px]', // Minimum touch target
    medium: 'px-6 py-3 text-base min-h-[48px]',
    large: 'px-8 py-4 text-lg min-h-[56px]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

/**
 * Touch-optimized input with large tap target and mobile keyboard support
 */
interface TouchInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  required?: boolean;
  error?: string;
  helperText?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric';
}

export function TouchInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error,
  helperText,
  autoComplete,
  inputMode,
}: TouchInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`
          w-full px-4 py-3 text-base
          bg-background border rounded-lg
          focus:outline-none focus:ring-2
          transition-all duration-200
          min-h-[48px]
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-blue-500'}
        `}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
}

/**
 * Loading spinner optimized for mobile
 */
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`border-4 border-primary border-t-transparent rounded-full animate-spin ${sizeClasses[size]}`}
      />
      {message && <p className="text-base text-muted-foreground">{message}</p>}
    </div>
  );
}

/**
 * Mobile-optimized card with touch feedback
 */
interface TouchCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TouchCard({ children, onClick, className = '' }: TouchCardProps) {
  const interactive = onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-lg' : '';

  return (
    <div
      onClick={onClick}
      className={`
        bg-card rounded-xl border border-border p-6 space-y-4
        transition-all duration-200 shadow-md
        ${interactive} ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Bottom sheet for mobile actions (iOS/Android style)
 */
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-6 py-3 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-100px)]">{children}</div>
      </div>
    </>
  );
}

/**
 * Mobile-friendly alert/notification
 */
interface MobileAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose?: () => void;
}

export function MobileAlert({ type, title, message, onClose }: MobileAlertProps) {
  const bgColors = {
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  };

  const textColors = {
    success: 'text-green-900 dark:text-green-100',
    error: 'text-red-900 dark:text-red-100',
    warning: 'text-yellow-900 dark:text-yellow-100',
    info: 'text-blue-900 dark:text-blue-100',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`rounded-lg border p-4 ${bgColors[type]}`}>
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${textColors[type]}`}>{icons[type]}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${textColors[type]}`}>{title}</h3>
          <p className={`text-sm mt-1 ${textColors[type]}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-2 ${textColors[type]} hover:opacity-70 min-w-[44px] min-h-[44px] flex items-center justify-center`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
  );
}

/**
 * Pull-to-refresh component for mobile
 */
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  // Simplified version - full implementation would require touch event handling
  return <div className="min-h-screen">{children}</div>;
}
