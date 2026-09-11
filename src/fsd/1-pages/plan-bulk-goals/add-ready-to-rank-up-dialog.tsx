import { useEffect, useMemo, useState } from 'react';

import { Rank } from '@/fsd/5-shared/model';
import { Button, PortalDialog, RankSelect, Switch } from '@/fsd/5-shared/ui';

import { ALL_RANK_VALUES } from '@/fsd/2-widgets/unit-threshold-picker';

import type { ReadyToRankUpOptions } from './bulk-goal-creator.service';

const VIABLE_RANKS = ALL_RANK_VALUES.filter(rank => rank > Rank.Locked);

interface Props {
    open: boolean;
    /** One entry per ready-to-rank-up character in the roster: that character's target rank. */
    targetRanks: Rank[];
    onClose: (result?: ReadyToRankUpOptions) => void;
}

export function AddReadyToRankUpDialog({ open, targetRanks, onClose }: Props) {
    const [raiseActiveAbility, setRaiseActiveAbility] = useState(false);
    const [raisePassiveAbility, setRaisePassiveAbility] = useState(false);
    const [minRank, setMinRank] = useState<Rank>(Rank.Stone1);
    const [maxRank, setMaxRank] = useState<Rank>(Rank.Adamantine2);

    useEffect(() => {
        if (open) {
            setRaiseActiveAbility(false);
            setRaisePassiveAbility(false);
            setMinRank(Rank.Stone1);
            setMaxRank(Rank.Adamantine2);
        }
    }, [open]);

    const matchingCount = useMemo(
        () => targetRanks.filter(rank => rank >= minRank && rank <= maxRank).length,
        [targetRanks, minRank, maxRank]
    );

    return (
        <PortalDialog open={open} onClose={() => onClose()} aria-label="Add Units Ready to Rank Up" size="sm">
            <PortalDialog.Header>Add Units Ready to Rank Up</PortalDialog.Header>
            <PortalDialog.Body>
                <Switch isSelected={raiseActiveAbility} onChange={setRaiseActiveAbility}>
                    Also raise Active Ability to XP level
                </Switch>
                <Switch isSelected={raisePassiveAbility} onChange={setRaisePassiveAbility}>
                    Also raise Passive Ability to XP level
                </Switch>
                <div className="flex items-end gap-2">
                    <RankSelect
                        label="Minimum Viable Rank"
                        rankValues={VIABLE_RANKS.filter(rank => rank <= maxRank)}
                        value={minRank}
                        valueChanges={value => setMinRank(value as Rank)}
                    />
                    <RankSelect
                        label="Maximum Viable Rank"
                        rankValues={VIABLE_RANKS.filter(rank => rank >= minRank)}
                        value={maxRank}
                        valueChanges={value => setMaxRank(value as Rank)}
                    />
                </div>
                {matchingCount === 0 ? (
                    <span className="text-sm text-red-600 dark:text-red-400">No units match the rank constraints</span>
                ) : (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {matchingCount} unit{matchingCount === 1 ? '' : 's'}
                    </span>
                )}
            </PortalDialog.Body>
            <PortalDialog.Footer>
                <Button intent="secondary" appearance="plain" onPress={() => onClose()}>
                    Cancel
                </Button>
                <Button
                    isDisabled={matchingCount === 0}
                    onPress={() => onClose({ raiseActiveAbility, raisePassiveAbility, minRank, maxRank })}>
                    Add
                </Button>
            </PortalDialog.Footer>
        </PortalDialog>
    );
}
