import { Link2, RefreshCw, RotateCcw, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';

import DailyRaidsSettings from 'src/shared-components/daily-raids-settings';

import { Button, PageToolbar, PageToolbarDivider } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { LinkButton } from '@/fsd/5-shared/ui/link';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

interface Props extends React.PropsWithChildren {
    actualDailyEnergy: string;
    resetHandler: () => void;
    refreshHandle: () => void;
    onAfterSync?: () => void;
    resetDisabled: boolean;
    refreshDisabled: boolean;
    hasSync: boolean;
}

export const RaidsHeader: React.FC<Props> = ({
    actualDailyEnergy,
    children,
    refreshDisabled,
    resetDisabled,
    resetHandler,
    refreshHandle,
    hasSync,
    onAfterSync,
}) => {
    const [openSettings, setOpenSettings] = useState<boolean>(false);

    return (
        <>
            <PageToolbar>
                {/* Navigation */}
                <LinkButton size="small" href={isMobile ? '/mobile/plan/goals' : '/plan/goals'}>
                    <Link2 data-slot="icon" />
                    Go to Goals
                </LinkButton>

                <PageToolbarDivider />

                {/* Primary config */}
                <Button intent="secondary" appearance="outline" size="small" onPress={() => setOpenSettings(true)}>
                    <Settings data-slot="icon" />
                    Raids Settings
                </Button>
                {children}
                <span className="flex items-center gap-1 text-sm text-(--soft-fg)">
                    <MiscIcon icon={'energy'} height={15} width={15} />
                    {actualDailyEnergy}
                </span>

                <PageToolbarDivider />

                {/* State actions */}
                {hasSync && (
                    <SyncButton intent="secondary" showText={true} appearance="outline" onAfterSync={onAfterSync} />
                )}
                <Button
                    intent="secondary"
                    appearance="outline"
                    size="small"
                    isDisabled={refreshDisabled}
                    onPress={refreshHandle}>
                    <RefreshCw data-slot="icon" />
                    {!isMobile && 'Refresh'}
                </Button>
                <Button
                    appearance="outline"
                    size="small"
                    intent="danger"
                    isDisabled={resetDisabled}
                    onPress={resetHandler}>
                    <RotateCcw data-slot="icon" />
                    Reset day
                </Button>
            </PageToolbar>

            <DailyRaidsSettings open={openSettings} close={() => setOpenSettings(false)} />
        </>
    );
};
