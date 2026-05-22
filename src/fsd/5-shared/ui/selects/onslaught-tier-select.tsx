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
        <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>

            <Listbox
                value={currentOption}
                onChange={handleChange}
                by={(a, z) => a.sector === z.sector && a.tier === z.tier}>
                <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-3 text-left shadow-sm transition-all hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-[#0f172a] dark:text-white">
                        <OnslaughtIcon sector={sector} tier={tier} size={tier < 4 ? 40 : 50} />
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                        </span>
                    </Listbox.Button>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-50 mt-2 max-h-[min(60vh,24rem)] w-full overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-[#161b22]">
                            {ALL_OPTIONS.map(opt => (
                                <Listbox.Option
                                    key={optionKey(opt)}
                                    value={opt}
                                    title={`${ONSLAUGHT_SECTOR_LABELS[opt.sector]} tier ${opt.tier}`}
                                    className={({ active }) =>
                                        `relative cursor-pointer py-2 pr-4 pl-3 font-medium transition-colors select-none ${
                                            active
                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                : 'text-gray-900 dark:text-gray-200'
                                        }`
                                    }>
                                    {({ selected }) => (
                                        <>
                                            <div className="mr-2 ml-2">
                                                <OnslaughtIcon
                                                    sector={opt.sector}
                                                    tier={opt.tier}
                                                    size={opt.tier < 4 ? 40 : 50}
                                                />
                                            </div>
                                            {selected && (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
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
