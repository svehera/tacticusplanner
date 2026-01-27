import SyncIcon from '@mui/icons-material/Sync';
import { Button } from '@mui/material';
import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { useSyncWithTacticus } from '@/fsd/3-features/tacticus-integration/useSyncWithTacticus';

interface SyncButtonProps {
    showText: boolean;
    variant?: 'text' | 'outlined' | 'contained' | undefined;
}

const SyncButton: React.FC<SyncButtonProps> = ({ showText, variant }) => {
    const { syncWithTacticus } = useSyncWithTacticus();

    const sync = async () => {
        console.log('Syncing with Tacticus...');
        await syncWithTacticus();
    };

    return (
        <Button
            size="small"
            aria-label="Sync with Tacticus"
            title="Sync with Tacticus"
            variant={variant !== undefined ? variant : 'contained'}
            color={'primary'}
            onClick={e => {
                e.stopPropagation();
                sync();
            }}>
            <SyncIcon /> {showText && 'Sync'}
        </Button>
    );
};

export { SyncButton };
