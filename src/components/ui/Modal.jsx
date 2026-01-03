"use client";

import { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  primaryButtonText,
  secondaryButtonText,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  hideFooter = false,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    small: "max-w-md",
    md: "max-w-lg",
    medium: "max-w-2xl",
    lg: "max-w-2xl",
    xl: "max-w-xl",
    "xl-small": "max-w-xl",
    full: "max-w-7xl",
  };

  const showFooter = !hideFooter && (primaryButtonText || secondaryButtonText);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl border border-gray-200/60 w-full ${sizeClasses[size]} ${size === 'full' ? 'max-h-[98vh] h-[98vh]' : size === 'xl' ? 'max-h-[90vh] h-[90vh]' : size === 'xl-small' ? 'max-h-[90vh]' : size === 'medium' ? 'max-h-[85vh] h-[85vh]' : size === 'md' ? 'max-h-[60vh]' : 'max-h-[90vh]'} overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-500 hover:text-gray-700 hover:scale-110 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto px-6 ${size === 'full' ? 'py-4 max-h-[calc(98vh-140px)]' : size === 'xl' ? 'pt-4 pb-2 max-h-[calc(90vh-140px)]' : size === 'xl-small' ? 'py-4 max-h-[calc(90vh-140px)]' : size === 'medium' ? 'py-4 max-h-[calc(85vh-140px)]' : size === 'md' ? 'py-4 max-h-[calc(60vh-140px)]' : 'py-4'}`}>{children}</div>

        {/* Footer opcional con botones de acción */}
        {showFooter && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-end space-x-3">
            {secondaryButtonText && (
              <button
                type="button"
                onClick={onSecondaryButtonClick || onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                {secondaryButtonText}
              </button>
            )}
            {primaryButtonText && (
              <button
                type="button"
                onClick={onPrimaryButtonClick}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-[0.98] transition-all duration-200"
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                {primaryButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
