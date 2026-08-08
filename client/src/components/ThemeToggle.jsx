import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--card-sub)] text-[var(--text-main)] border border-[var(--glass-border)] hover:border-indigo-500 transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 ${className}`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="text-amber-400 transition-transform duration-300 hover:rotate-45" size={16} />
      ) : (
        <Moon className="text-indigo-500 transition-transform duration-300 hover:-rotate-12" size={16} />
      )}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
