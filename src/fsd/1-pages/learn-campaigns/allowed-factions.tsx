import { factionLookup } from '@/fsd/5-shared/lib';
import { Alliance, FactionId } from '@/fsd/5-shared/model';

import { FactionImage } from '@/fsd/4-entities/faction';

export const AllowedFactions = ({ alliance, factions }: { alliance: Alliance; factions: FactionId[] }) => {
    if (factions.length === 0) return <></>;

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                Allowed factions ({alliance})
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
                {factions.map(faction => (
                    <span
                        key={faction}
                        className="flex items-center gap-1.5 rounded-full border border-(--border) bg-(--soft) px-2.5 py-1 text-xs text-(--fg)">
                        <FactionImage faction={faction} />
                        {factionLookup[faction].name}
                    </span>
                ))}
            </div>
        </div>
    );
};
