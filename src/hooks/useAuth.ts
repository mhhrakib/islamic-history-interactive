import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// This hook is just a shortcut to avoid importing useContext and AuthContext in every component.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
