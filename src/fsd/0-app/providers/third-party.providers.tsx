import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { SnackbarOrigin, SnackbarProvider, closeSnackbar } from 'notistack';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { PopupProvider } from 'react-popup-manager';
import { RouterProvider } from 'react-router-dom';
import { AnalyticsProvider } from 'use-analytics';

import analytics from '../monitoring/analytics';
import { routes } from '../routing/app-routing';

const webSnackbarOrigin: SnackbarOrigin = { vertical: 'bottom', horizontal: 'right' };
const mobileSnackbarOrigin: SnackbarOrigin = { vertical: 'top', horizontal: 'center' };

// Wrapper component to work around TypeScript JSX component type issue
const PopupWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const Provider = PopupProvider as any;
    return <Provider>{children}</Provider>;
};

export const ThirdPartyProviders: React.FC = () => {
    const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL, { expectAuth: true });
    const convexQueryClient = new ConvexQueryClient(convexClient);
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                queryKeyHashFn: convexQueryClient.hashFn(),
                queryFn: convexQueryClient.queryFn(),
            },
        },
    });
    convexQueryClient.connect(queryClient);
    return (
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
            {/* eslint-disable-next-line react-compiler/react-compiler*/}
            <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
                <QueryClientProvider client={queryClient}>
                    <AnalyticsProvider instance={analytics}>
                        <SnackbarProvider
                            autoHideDuration={5000}
                            anchorOrigin={isMobile ? mobileSnackbarOrigin : webSnackbarOrigin}
                            onEntered={(node, _isAppearing, key) =>
                                node.addEventListener('click', () => closeSnackbar(key))
                            }
                        />
                        <PopupWrapper>
                            <RouterProvider router={routes} />
                        </PopupWrapper>
                    </AnalyticsProvider>
                    <TanStackDevtools
                        config={{ position: 'bottom-right' }}
                        plugins={[{ name: 'Query', render: <ReactQueryDevtoolsPanel /> }]}
                    />
                </QueryClientProvider>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
};
