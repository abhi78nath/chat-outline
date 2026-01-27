import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const checkTheme = () => {
            const isLight = document.documentElement.classList.contains('light');
            setTheme(isLight ? 'light' : 'dark');
        };

        // Initial check
        checkTheme();

        // Observe class changes on html element
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return theme;
};
