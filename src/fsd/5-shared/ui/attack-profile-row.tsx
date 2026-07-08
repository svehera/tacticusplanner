/* eslint-disable import-x/no-internal-modules */
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

interface AttackProfileRowProps {
    hits: number;
    damageType: string;
    /** Present ⇒ ranged (shown with the range number overlaid on the icon); absent ⇒ melee. */
    range?: number;
}

export const AttackProfileRow = ({ hits, damageType, range }: AttackProfileRowProps) => {
    const damageTypeIcon = tacticusIcons[`damage${damageType}`];

    return (
        <div className="flex items-center gap-2">
            {range === undefined ? (
                <img src={tacticusIcons.meleeAttack.file} alt="Melee" className="h-7 w-7 shrink-0" />
            ) : (
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                    <img src={tacticusIcons.rangedAttack.file} alt="Range" className="absolute inset-0 h-full w-full" />
                    <span className="relative z-10 text-xs font-bold text-(--ability-range-text)">{range}</span>
                </div>
            )}
            {damageTypeIcon && <img src={damageTypeIcon.file} alt={damageType} className="h-8 w-8 shrink-0" />}
            <span className="flex-1 text-sm font-bold tracking-wide text-(--fg)">{damageType.toUpperCase()}</span>
            <img src={tacticusIcons.hitsIcon.file} alt="Hits" className="h-5 w-5 shrink-0" />
            <span className="text-sm font-semibold text-(--fg)">{hits}</span>
        </div>
    );
};
