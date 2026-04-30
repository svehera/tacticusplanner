import CloseIcon from '@mui/icons-material/Close';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    SwipeableDrawer,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import React from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ExpandableRaidLocations } from './expandable-raid-locations';
import { IUpgradeRaid } from './goals.models';
import { getCharacterIcon, getDisplayName } from './raid-day-helpers';
import { RaidMaterialIcon } from './raid-material-icon';

// ─── Component ───────────────────────────────────────────────────────────────

interface RaidMaterialDialogProps {
    raid: IUpgradeRaid;
    onClose: () => void;
}

export const RaidMaterialDialog: React.FC<RaidMaterialDialogProps> = ({ raid, onClose }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const afterRaids = raid.acquiredCount + raid.raidLocations.reduce((s, loc) => s + loc.farmedItems, 0);
    const isSufficient = afterRaids >= raid.requiredCount;
    const inventoryPct = raid.requiredCount > 0 ? Math.min((raid.acquiredCount / raid.requiredCount) * 100, 100) : 0;
    const gainPct =
        raid.requiredCount > 0
            ? Math.min(((afterRaids - raid.acquiredCount) / raid.requiredCount) * 100, 100 - inventoryPct)
            : 0;
    const uniqueCharIds = [...new Set(raid.relatedCharacters)];

    const titleRow = (
        <DialogTitle id="raid-material-dialog-title" className="flex items-center gap-3 pr-2 text-(--card-fg)">
            <div className="shrink-0">
                <RaidMaterialIcon raid={raid} size={44} />
            </div>
            <span className="flex-1 text-inherit">{raid.label}</span>
            <IconButton
                aria-label="close"
                onClick={onClose}
                size={isMobile ? 'medium' : 'small'}
                className={isMobile ? 'min-h-[44px] min-w-[44px] self-start' : 'self-start'}>
                <CloseIcon fontSize={isMobile ? 'medium' : 'small'} />
            </IconButton>
        </DialogTitle>
    );

    const bodyContent = (
        <DialogContent className="flex flex-col gap-5 pb-5! text-(--card-fg)">
            {uniqueCharIds.length > 0 && (
                <div>
                    <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">
                        Characters
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {uniqueCharIds.map(id => (
                            <div key={id} className="flex items-center gap-1.5">
                                <UnitShardIcon icon={getCharacterIcon(id)} height={28} width={28} />
                                <span className="text-sm text-inherit">{getDisplayName(id)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">Progress</div>
                <div className="relative mb-3 h-3 w-full overflow-hidden rounded-full bg-(--secondary)">
                    <div className="absolute top-0 left-0 h-full bg-slate-400" style={{ width: `${inventoryPct}%` }} />
                    <div
                        className={`absolute top-0 h-full transition-all ${isSufficient ? 'bg-green-500' : 'bg-orange-400'}`}
                        style={{ left: `${inventoryPct}%`, width: `${gainPct}%` }}
                    />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-(--secondary) p-2">
                        <div className="text-xs text-(--muted-fg)">In inventory</div>
                        <div className="text-xl font-bold text-inherit">{Math.floor(raid.acquiredCount)}</div>
                    </div>
                    <div className="rounded-lg bg-(--secondary) p-2">
                        <div className="text-xs text-(--muted-fg)">After raids</div>
                        <div className={`text-xl font-bold ${isSufficient ? 'text-green-500' : 'text-orange-400'}`}>
                            {Math.floor(afterRaids)}
                        </div>
                    </div>
                    <div className="rounded-lg bg-(--secondary) p-2">
                        <div className="text-xs text-(--muted-fg)">Required</div>
                        <div className="text-xl font-bold text-inherit">{raid.requiredCount}</div>
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-2 text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">Locations</div>
                <ExpandableRaidLocations locations={raid.raidLocations} />
            </div>
        </DialogContent>
    );

    if (isMobile) {
        return (
            <SwipeableDrawer
                anchor="bottom"
                open
                onClose={onClose}
                onOpen={() => {}}
                disableSwipeToOpen
                PaperProps={{
                    className: 'bg-(--card-bg)! text-(--card-fg)!',
                    sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85vh' },
                }}
                aria-labelledby="raid-material-dialog-title">
                <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
                    <div className="h-1.5 w-10 rounded-full bg-(--card-border)" />
                </div>
                {titleRow}
                {bodyContent}
            </SwipeableDrawer>
        );
    }

    return (
        <Dialog
            open
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ className: 'bg-(--card-bg)! text-(--card-fg)!' }}
            aria-labelledby="raid-material-dialog-title">
            {titleRow}
            {bodyContent}
        </Dialog>
    );
};
