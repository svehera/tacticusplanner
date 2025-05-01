import React from 'react';

import { AuthProvider } from 'src/contexts/auth.provider';
import { LoaderProvider } from 'src/contexts/loader.provider';
import { TitleProvider } from 'src/contexts/title.provider';
import { StoreProvider } from 'src/reducers/store.provider2';

export const FirstPartyProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <AuthProvider>
            <TitleProvider>
                <LoaderProvider>
                    <StoreProvider>{children}</StoreProvider>
                </LoaderProvider>
            </TitleProvider>
        </AuthProvider>
    );
};
