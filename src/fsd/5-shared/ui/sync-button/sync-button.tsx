import SyncIcon from '@mui/icons-material/Sync';
import { Button, IconButton } from '@mui/material';
import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { useSyncWithTacticus } from '@/fsd/3-features/tacticus-integration/use-sync-with-tacticus';

interface SyncButtonProps {
    showText: boolean;
    variant?: 'text' | 'outlined' | 'contained' | undefined;
    className?: string;
    iconButton?: boolean;
}

const SyncButton: React.FC<SyncButtonProps> = ({ showText, variant, className, iconButton }) => {
    const { syncWithTacticus } = useSyncWithTacticus();

    const sync = async () => {
        console.log('Syncing with Tacticus...');
        await syncWithTacticus();
    };

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        sync();
    };

    if (iconButton) {
        return (
            <IconButton
                color="inherit"
                aria-label="Sync with Tacticus"
                title="Sync with Tacticus"
                onClick={handleClick}>
                <SyncIcon />
            </IconButton>
        );
    }

    return (
        <Button
            size="small"
            aria-label="Sync with Tacticus"
            title="Sync with Tacticus"
            variant={variant === undefined ? 'contained' : variant}
            color={'primary'}
            className={className}
            onClick={handleClick}>
            <SyncIcon /> {showText && 'Sync'}
        </Button>
    );
};

export { SyncButton };
