import SyncIcon from '@mui/icons-material/Sync';
import React from 'react';

import { Button } from '@/fsd/5-shared/ui';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { useSyncWithTacticus } from '@/fsd/3-features/tacticus-integration/use-sync-with-tacticus';

type Appearance = 'solid' | 'outline' | 'plain';

const variantToAppearance: Record<string, Appearance> = {
    contained: 'solid',
    outlined: 'outline',
    text: 'plain',
};

interface SyncButtonProps {
    showText: boolean;
    variant?: 'text' | 'outlined' | 'contained' | undefined;
    className?: string;
    iconButton?: boolean;
    onAfterSync?: () => void;
}

const SyncButton: React.FC<SyncButtonProps> = ({ showText, variant, className, iconButton, onAfterSync }) => {
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
                aria-label="Sync with Tacticus"
                className={className}
                onPress={() => sync()}>
                <SyncIcon />
            </Button>
        );
    }

    const appearance = variantToAppearance[variant ?? 'contained'] ?? 'solid';

    return (
        <Button
            size="small"
            intent="primary"
            appearance={appearance}
            aria-label="Sync with Tacticus"
            className={className}
            onPress={() => sync()}>
            <SyncIcon /> {showText && 'Sync'}
        </Button>
    );
};

export { SyncButton };
