import { RefreshCcw } from 'lucide-react';
import React from 'react';

import { Button } from '@/fsd/5-shared/ui';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { useSyncWithTacticus } from '@/fsd/3-features/tacticus-integration/use-sync-with-tacticus';

interface SyncButtonProps {
    showText: boolean;
    appearance?: 'solid' | 'outline' | 'plain';
    intent?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    className?: string;
    iconButton?: boolean;
    onAfterSync?: () => void;
}

const SyncButton: React.FC<SyncButtonProps> = ({
    showText,
    appearance = 'solid',
    intent = 'primary',
    className,
    iconButton,
    onAfterSync,
}) => {
    const { syncWithTacticus } = useSyncWithTacticus();

    const sync = async () => {
        await syncWithTacticus();
        onAfterSync?.();
    };

    if (iconButton) {
        return (
            <Button
                size="square-petite"
                appearance="plain"
                intent="secondary"
                aria-label="Sync with Tacticus"
                className={className}
                onPress={() => sync()}>
                <RefreshCcw data-slot="icon" />
            </Button>
        );
    }

    return (
        <Button
            size="small"
            intent={intent}
            appearance={appearance}
            aria-label="Sync with Tacticus"
            className={className}
            onPress={() => sync()}>
            <RefreshCcw data-slot="icon" /> {showText && 'Sync'}
        </Button>
    );
};

export { SyncButton };
