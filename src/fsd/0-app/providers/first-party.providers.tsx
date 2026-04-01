import { FC, PropsWithChildren } from 'react';

import { StoreProvider } from 'src/reducers/store.provider2';

import { LoaderProvider, TitleProvider } from '@/fsd/5-shared/ui/contexts';

export const FirstPartyProviders: FC<PropsWithChildren> = ({ children }) => {
    return (
        <TitleProvider>
            <LoaderProvider>
                <StoreProvider>{children}</StoreProvider>
            </LoaderProvider>
        </TitleProvider>
    );
};
