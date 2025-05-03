import { createContext, useContext } from 'react';

interface LoaderContextProps {
    loading: boolean;
    loadingText?: string;
    startLoading: (text: string) => void;
    endLoading: () => void;
}

export const LoaderContext = createContext<LoaderContextProps>({
    loading: false,
    loadingText: '',
    startLoading: () => {},
    endLoading: () => {},
});

export const useLoader = () => {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoader must be used within a LoaderProvider');
    }
    return context;
};
