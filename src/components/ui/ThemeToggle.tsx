'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('ekaagra_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } else {
      // Default to warm light ivory brand theme
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('ekaagra_theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  if (!mounted) {
    return (
      <button 
        type="button" 
        className="w-9 h-9 rounded-xl bg-white/80 border border-[#E2E8F0] flex items-center justify-center text-[#64748B]"
        aria-label="Toggle theme"
      >
        <Moon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-xl bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-white/10 flex items-center justify-center text-[#475569] dark:text-slate-300 hover:text-[#4338CA] dark:hover:text-white transition-all shadow-sm cursor-pointer hover:border-[#4338CA]/30"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-[#475569] transition-transform hover:-rotate-12" />
      ) : (
        <Sun className="w-4 h-4 text-[#F4C95D] transition-transform hover:rotate-45" />
      )}
    </button>
  );
}

