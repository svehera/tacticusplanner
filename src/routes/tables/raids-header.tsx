import { Link2, RefreshCw, RotateCcw, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';

import DailyRaidsSettings from 'src/shared-components/daily-raids-settings';

import { Button, Separator } from '@/fsd/5-shared/ui';
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
            <div className="flex flex-wrap items-center gap-3">
                {/* Navigation */}
                <LinkButton appearance="outline" size="small" href={isMobile ? '/mobile/plan/goals' : '/plan/goals'}>
                    <Link2 data-slot="icon" />
                    Go to Goals
                </LinkButton>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Primary config */}
                <Button intent="primary" size="small" onPress={() => setOpenSettings(true)}>
                    <Settings data-slot="icon" />
                    Raids Settings
                </Button>
                {children}
                <span className="flex items-center gap-1 text-sm text-(--soft-fg)">
                    <MiscIcon icon={'energy'} height={15} width={15} />
                    {actualDailyEnergy}
                </span>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* State actions */}
                {hasSync && <SyncButton showText={true} appearance="outline" onAfterSync={onAfterSync} />}
                <Button
                    appearance="outline"
                    size="small"
                    intent="success"
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
            </div>

            <DailyRaidsSettings open={openSettings} close={() => setOpenSettings(false)} />
        </>
    );
};
