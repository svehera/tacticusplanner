import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment } from 'react';

import { Rarity } from '@/fsd/5-shared/model';

import { RarityIcon } from '../icons';

export const RaritySelect2 = ({
    rarityValues,
    value,
    valueChanges,
    label,
    hideText = false,
}: {
    label?: string;
    rarityValues: number[];
    value: number;
    valueChanges: (value: number) => void;
    hideText?: boolean;
}) => {
    return (
        <div className="w-full">
            {label && <label className="mb-2 block text-sm font-medium text-(--soft-fg)">{label}</label>}

            <Listbox value={value} onChange={valueChanges}>
                <div className="relative">
                    <Listbox.Button className="relative flex h-10 w-full cursor-pointer items-center rounded-lg border border-(--input) bg-(--bg) pr-10 pl-3 text-left text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:ring-2 focus:ring-(--ring) focus:outline-none">
                        <div className="flex items-center gap-2">
                            <RarityIcon rarity={value} />
                            {!hideText && <span>{Rarity[value]}</span>}
                        </div>

                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-4 w-4 text-(--soft-fg)" />
                        </span>
                    </Listbox.Button>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-50 mt-2 w-full overflow-auto rounded-lg border border-(--border) bg-(--overlay) py-1 shadow-xl">
                            {rarityValues.map(rarity => (
                                <Listbox.Option
                                    key={rarity}
                                    value={rarity}
                                    className={({ active }) =>
                                        `relative cursor-pointer py-2 pr-4 pl-10 text-(--fg) transition-colors select-none ${
                                            active ? 'bg-(--primary)/10 text-(--primary)' : ''
                                        }`
                                    }>
                                    {({ selected }) => (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <RarityIcon rarity={rarity} />
                                                {!hideText && <span>{Rarity[rarity]}</span>}
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
