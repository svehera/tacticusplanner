/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { OnslaughtIcon } from '@/fsd/5-shared/ui/icons/onslaught-icon';

import {
    type OnslaughtSector,
    type OnslaughtTier,
    ONSLAUGHT_SECTOR_LABELS,
    ONSLAUGHT_SECTORS,
    ONSLAUGHT_TIERS,
} from '@/fsd/1-pages/input-onslaught/onslaught-rewards';

import { checkIconClass, labelClass } from './select-styles';

interface OnslaughtTierOption {
    sector: OnslaughtSector;
    tier: OnslaughtTier;
}

const ALL_OPTIONS: OnslaughtTierOption[] = ONSLAUGHT_SECTORS.flatMap(sector => [
    ...ONSLAUGHT_TIERS.map(tier => ({ sector, tier })),
    { sector, tier: 4 as OnslaughtTier },
]);

export const OnslaughtTierSelect = ({
    sector,
    tier,
    onChange,
    label,
}: {
    label: string;
    sector: OnslaughtSector;
    tier: OnslaughtTier;
    onChange: (sector: OnslaughtSector, tier: OnslaughtTier) => void;
}) => {
    const currentOption: OnslaughtTierOption = { sector, tier };

    return (
        <div className="w-fit">
            <label className={labelClass}>{label}</label>

            <Listbox
                value={currentOption}
                onChange={(opt: OnslaughtTierOption) => onChange(opt.sector, opt.tier)}
                by={(a: OnslaughtTierOption, z: OnslaughtTierOption) => a.sector === z.sector && a.tier === z.tier}>
                <div className="relative">
                    <ListboxButton className="flex cursor-pointer items-center gap-1 rounded-lg border border-(--input) bg-(--bg) py-2 pr-2 pl-2 text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:ring-2 focus:ring-(--ring) focus:outline-none">
                        <div className="flex w-[50px] shrink-0 items-center justify-center">
                            <OnslaughtIcon sector={sector} tier={tier} size={tier < 4 ? 40 : 50} />
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-(--soft-fg)" />
                    </ListboxButton>

                    <ListboxOptions
                        transition
                        anchor="bottom start"
                        className="z-50 mt-2 max-h-[min(60vh,24rem)] w-fit overflow-y-auto overscroll-contain rounded-lg border border-(--border) bg-(--overlay) py-1 shadow-xl transition duration-100 ease-in data-leave:opacity-0">
                        {ALL_OPTIONS.map(opt => (
                            <ListboxOption
                                key={`${opt.sector}-${opt.tier}`}
                                value={opt}
                                title={`${ONSLAUGHT_SECTOR_LABELS[opt.sector]} tier ${opt.tier}`}
                                className={({ focus }) =>
                                    `relative cursor-pointer px-2 py-2 font-medium transition-colors select-none ${
                                        focus ? 'bg-(--primary)/10 text-(--primary)' : 'text-(--overlay-fg)'
                                    }`
                                }>
                                {({ selected }) => (
                                    <>
                                        <div className="flex w-[50px] shrink-0 items-center justify-center">
                                            <OnslaughtIcon
                                                sector={opt.sector}
                                                tier={opt.tier}
                                                size={opt.tier < 4 ? 40 : 50}
                                            />
                                        </div>
                                        {selected && (
                                            <span className={checkIconClass}>
                                                <Check className="h-4 w-4" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </div>
            </Listbox>
        </div>
    );
};
