import type { OnslaughtSector } from './data';
import { KillzoneList } from './KillzoneList';
import { indexToRomanNumeral } from './utils';

export function SectorCard({ sector, sectorIndex }: { sector: OnslaughtSector; sectorIndex: number }) {
    return (
        <details className="group rounded-lg border border-amber-700/50 bg-linear-to-b from-stone-900/80 to-stone-950/90 shadow-sm transition-shadow hover:shadow-md">
            <summary className="flex cursor-pointer select-none items-baseline gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-stone-800/50 sm:px-4 sm:py-3 sm:text-base [&::-webkit-details-marker]:hidden [&::marker]:hidden">
                <span className="font-semibold text-amber-100">Sector {indexToRomanNumeral(sectorIndex)}</span>
                <span className="text-stone-500">—</span>
                <span className="text-sm text-stone-400">
                    Character Power required: <span className="font-medium text-amber-200">{sector.minHeroPower}</span>
                </span>
            </summary>

            <div className="border-t border-amber-700/30 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
                <KillzoneList killzones={sector.killzones} />
            </div>
        </details>
    );
}
