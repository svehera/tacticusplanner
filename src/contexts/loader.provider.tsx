import React, { useState } from 'react';
import { LoaderContext } from './loader.context';

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<string>('');

    const startLoading = (text: string) => {
        setLoading(true);
        setLoadingText(text);
    };

    const endLoading = () => {
        setLoading(false);
        setLoadingText('');
    };

    return (
        <LoaderContext.Provider value={{ loadingText, loading, startLoading, endLoading }}>
            {children}
        </LoaderContext.Provider>
    );
};
