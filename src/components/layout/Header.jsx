"use client";

import { useState, useEffect } from "react";

export function Header({ onMenuToggle }) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 shadow-sm">
      {/* Left section */}
      <div className="flex items-center space-x-5">
        <button
          onClick={onMenuToggle}
          className="p-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 group"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Sistema de Integración
          </h1>
          <div className="h-5 w-px bg-gray-200"></div>
          <span className="text-base font-semibold text-gray-600">ZEUS SAFETY</span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button 
          className="relative p-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 group" 
          aria-label="Notificaciones"
        >
          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            13
          </span>
        </button>

        {/* Settings */}
        <button 
          className="p-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 group" 
          aria-label="Configuración"
        >
          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Time */}
        <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-sm font-semibold text-gray-700 tabular-nums">{currentTime}</span>
        </div>
      </div>
    </header>
  );
}
