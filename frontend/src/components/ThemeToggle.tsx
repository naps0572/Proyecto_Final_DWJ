import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'soportedesk-theme';

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = mode === 'system'
    ? (prefersDark ? 'dark' : 'light')
    : mode;
  document.documentElement.dataset.themeMode = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') applyTheme('system');
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [mode]);

  return (
    <div className="theme-toggle" aria-label="Modo de apariencia">
      <button
        type="button"
        className={mode === 'light' ? 'active' : ''}
        onClick={() => setMode('light')}
        title="Modo claro"
        aria-label="Modo claro"
      >
        ☀
      </button>
      <button
        type="button"
        className={mode === 'dark' ? 'active' : ''}
        onClick={() => setMode('dark')}
        title="Modo oscuro"
        aria-label="Modo oscuro"
      >
        ◐
      </button>
      <button
        type="button"
        className={mode === 'system' ? 'active' : ''}
        onClick={() => setMode('system')}
        title="Usar tema del sistema"
        aria-label="Usar tema del sistema"
      >
        A
      </button>
    </div>
  );
}
