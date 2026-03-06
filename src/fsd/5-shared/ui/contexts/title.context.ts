import { createContext, useContext } from 'react';

interface TitleContextProperties {
    headerTitle: string;
    setHeaderTitle: (title: string) => void;
}

export const TitleContext = createContext<TitleContextProperties | undefined>(undefined);

export const useTitle = () => {
    const context = useContext(TitleContext);
    if (!context) {
        throw new Error('useTitle must be used within a TitleProvider');
    }
    return context;
};
