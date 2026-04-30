import { FC, memo } from 'react';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

interface DayCardStatsProps {
    energyTotal: number;
    raidsTotal: number;
    energyPerDay: number;
}

const DayCardStatsComponent: FC<DayCardStatsProps> = ({ energyTotal, raidsTotal, energyPerDay }) => {
    const energyFillPct = energyPerDay > 0 ? Math.min((energyTotal / energyPerDay) * 100, 100) : 0;
    const energyFull = energyFillPct >= 95;

    return (
        <>
            <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-(--secondary) px-2 py-0.5 text-xs">
                    <MiscIcon icon="energy" height={12} width={12} />
                    <span>{energyTotal}</span>
                    {energyPerDay > 0 && <span className="opacity-50">/{energyPerDay}</span>}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-(--secondary) px-2 py-0.5 text-xs">
                    <MiscIcon icon="raidTicket" height={12} width={12} />
                    {raidsTotal}
                </span>
            </div>
            {energyPerDay > 0 && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--secondary)">
                    <div
                        className={`h-full rounded-full transition-all ${energyFull ? 'bg-green-500' : 'bg-amber-400'}`}
                        style={{ width: `${energyFillPct}%` }}
                    />
                </div>
            )}
        </>
    );
};

export const DayCardStats = memo(DayCardStatsComponent);
