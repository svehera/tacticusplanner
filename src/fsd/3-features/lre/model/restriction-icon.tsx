import CloseIcon from '@mui/icons-material/Close';
import { Badge } from '@mui/material';

import { DamageType, FactionId, Trait } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { DamageTypeImage, MiscIcon, TraitImage } from '@/fsd/5-shared/ui/icons';

import { FactionImage } from '@/fsd/4-entities/faction';

interface RestrictionIconProps {
    objectiveType?: string;
    objectiveTarget?: string;
    sizePx?: number;
    tooltip?: string;
}

const NegatedIcon = ({ children }: { children: React.ReactNode }) => (
    <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
            <span className="flex size-3.5 items-center justify-center rounded-full bg-red-600 text-white">
                <CloseIcon sx={{ fontSize: 10 }} />
            </span>
        }>
        {children}
    </Badge>
);

const HitsIcon = ({ direction, sizePx }: { direction: 'max' | 'min'; sizePx: number }) => (
    <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
            <span className="flex size-3.5 items-center justify-center rounded-full bg-(--overlay) text-[10px] leading-none font-bold">
                {direction === 'max' ? '≤' : '≥'}
            </span>
        }>
        <MiscIcon icon="statHits" width={sizePx} height={sizePx} />
    </Badge>
);

/**
 * Renders the appropriate Snowprint icon for an LRE restriction's `objectiveType`/
 * `objectiveTarget`, with a red-X overlay for "not allowed" restrictions. Replaces the old
 * per-restriction hand-drawn icons in `src/assets/images/lre/`.
 */
export function RestrictionIcon({ objectiveType, objectiveTarget, sizePx, tooltip }: RestrictionIconProps) {
    const size = sizePx ?? 25;
    const target = objectiveTarget ?? '';

    const icon = (() => {
        switch (objectiveType) {
            case 'Trait': {
                return <TraitImage trait={Trait[target as keyof typeof Trait]} width={size} height={size} />;
            }
            case 'NotTrait': {
                return (
                    <NegatedIcon>
                        <TraitImage trait={Trait[target as keyof typeof Trait]} width={size} height={size} />
                    </NegatedIcon>
                );
            }
            case 'DamageType': {
                return <DamageTypeImage damageType={target as DamageType} width={size} height={size} />;
            }
            case 'NotDamageType': {
                return (
                    <NegatedIcon>
                        <DamageTypeImage damageType={target as DamageType} width={size} height={size} />
                    </NegatedIcon>
                );
            }
            case 'Faction': {
                return <FactionImage faction={target as FactionId} />;
            }
            case 'NotFaction': {
                return (
                    <NegatedIcon>
                        <FactionImage faction={target as FactionId} />
                    </NegatedIcon>
                );
            }
            case 'MaxHits': {
                return <HitsIcon direction="max" sizePx={size} />;
            }
            case 'MinHits': {
                return <HitsIcon direction="min" sizePx={size} />;
            }
            case 'HasRangedAttack': {
                return <MiscIcon icon="statRangedAttack" width={size} height={size} />;
            }
            case 'HasNoRangedAttack': {
                return <MiscIcon icon="statMeleeAttack" width={size} height={size} />;
            }
            case 'NoSummons': {
                return (
                    <NegatedIcon>
                        <TraitImage trait={Trait.Summon} width={size} height={size} />
                    </NegatedIcon>
                );
            }
            case 'KillScore':
            case 'HighScore': {
                return <MiscIcon icon="lreScore" width={size} height={size} />;
            }
            case 'DefeatAll': {
                return <MiscIcon icon="lreDefeatAll" width={size} height={size} />;
            }
            default: {
                return;
            }
        }
    })();

    if (!icon) return;
    return tooltip ? <AccessibleTooltip title={tooltip}>{icon}</AccessibleTooltip> : icon;
}
