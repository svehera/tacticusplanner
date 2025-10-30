import { FC, PropsWithChildren } from 'react';

import { StoreProvider } from 'src/reducers/store.provider2';

import { AuthProvider } from '@/fsd/5-shared/model';
import { LoaderProvider, TitleProvider } from '@/fsd/5-shared/ui/contexts';

export const FirstPartyProviders: FC<PropsWithChildren> = ({ children }) => {
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
