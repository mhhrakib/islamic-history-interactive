
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon, FacebookIcon, ProfileIcon, CloseIcon } from './icons';
import type { UserProvider } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleLogin = (provider: UserProvider) => {
    login(provider);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-surface dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm m-4 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-gray-200 rounded-full">
            <CloseIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-green-300">{t('authModal.title')}</h2>
          <p className="mt-2 text-text-secondary dark:text-gray-400">
            {t('authModal.subtitle')}
          </p>
        </div>

        <div className="p-6 space-y-4">
            <button
                onClick={() => handleLogin('google')}
                className="w-full flex items-center justify-center gap-3 p-3 border border-border-color dark:border-gray-600 rounded-lg hover:bg-base dark:hover:bg-gray-700 transition-colors font-semibold text-text-primary dark:text-gray-100"
            >
                <GoogleIcon className="w-6 h-6" />
                {t('authModal.google')}
            </button>
            <button
                onClick={() => handleLogin('facebook')}
                className="w-full flex items-center justify-center gap-3 p-3 border border-border-color dark:border-gray-600 rounded-lg hover:bg-base dark:hover:bg-gray-700 transition-colors font-semibold text-text-primary dark:text-gray-100"
            >
                <FacebookIcon className="w-6 h-6" />
                {t('authModal.facebook')}
            </button>
        </div>

        <div className="p-6 border-t border-border-color dark:border-gray-700 text-center">
            <button
                onClick={() => handleLogin('guest')}
                className="w-full flex items-center justify-center gap-3 py-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-green-300 transition-colors font-semibold"
            >
                <ProfileIcon className="w-5 h-5" />
                {t('authModal.guest')}
            </button>
             <button
                onClick={() => handleLogin('admin')}
                className="text-xs text-text-secondary dark:text-gray-500 hover:text-primary dark:hover:text-green-300 transition-colors mt-2"
            >
                {t('authModal.admin')}
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
