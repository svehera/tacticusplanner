/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment } from 'react';

import { OnslaughtIcon } from '@/fsd/5-shared/ui/icons/onslaught-icon';

import {
    type OnslaughtSector,
    type OnslaughtTier,
    ONSLAUGHT_SECTOR_LABELS,
    ONSLAUGHT_SECTORS,
    ONSLAUGHT_TIERS,
} from '@/fsd/1-pages/input-onslaught/onslaught-rewards';

interface OnslaughtTierOption {
    sector: OnslaughtSector;
    tier: OnslaughtTier;
}

/** Flattened list: for each sector, show a "whole sector" option then tiers 1-3 */
const ALL_OPTIONS: OnslaughtTierOption[] = ONSLAUGHT_SECTORS.flatMap(sector => [
    ...ONSLAUGHT_TIERS.map(tier => ({ sector, tier })),
    { sector, tier: 4 as OnslaughtTier },
]);

function optionKey(o: OnslaughtTierOption) {
    return `${o.sector}-${o.tier}`;
}

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
    const handleChange = (value: OnslaughtTierOption) => onChange(value.sector, value.tier);

    // Find the matching option; prefer exact tier match, fall back to whole
    const currentOption: OnslaughtTierOption = { sector, tier };

    return (
        <div className="w-fit">
            <label className="mb-2 block text-sm font-medium text-(--soft-fg)">{label}</label>

            <Listbox
                value={currentOption}
                onChange={handleChange}
                by={(a, z) => a.sector === z.sector && a.tier === z.tier}>
                <div className="relative">
                    <Listbox.Button className="flex cursor-pointer items-center gap-1 rounded-lg border border-(--input-border) bg-(--bg) py-2 pr-2 pl-2 text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:ring-2 focus:ring-(--primary) focus:outline-none">
                        <div className="flex w-[50px] shrink-0 items-center justify-center">
                            <OnslaughtIcon sector={sector} tier={tier} size={tier < 4 ? 40 : 50} />
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-(--soft-fg)" />
                    </Listbox.Button>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-50 mt-2 max-h-[min(60vh,24rem)] w-fit overflow-y-auto overscroll-contain rounded-lg border border-(--border) bg-(--overlay) py-1 shadow-xl">
                            {ALL_OPTIONS.map(opt => (
                                <Listbox.Option
                                    key={optionKey(opt)}
                                    value={opt}
                                    title={`${ONSLAUGHT_SECTOR_LABELS[opt.sector]} tier ${opt.tier}`}
                                    className={({ active }) =>
                                        `relative cursor-pointer px-2 py-2 font-medium transition-colors select-none ${
                                            active ? 'bg-(--primary)/10 text-(--primary)' : 'text-(--overlay-fg)'
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
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-(--primary)">
                                                    <Check className="h-4 w-4" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
};
