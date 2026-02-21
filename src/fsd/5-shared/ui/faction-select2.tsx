/* eslint-disable boundaries/element-types */
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment } from 'react';

import { FactionImage } from '@/fsd/4-entities/faction';

import { factionLookup } from '../lib';
import { FactionId } from '../model';

export const FactionSelect2 = ({
    factionValues,
    value,
    valueChanges,
    label,
}: {
    label: string;
    factionValues: FactionId[];
    value: FactionId[]; // 👈 now array
    valueChanges: (value: FactionId[]) => void;
}) => {
    return (
        <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="relative">
                <Listbox value={value} onChange={valueChanges} multiple>
                    <div className="relative">
                        {/* BUTTON */}
                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-3 text-left shadow-sm transition-all hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-[#0f172a] dark:text-white">
                            <div className="flex flex-wrap items-center gap-2">
                                {value.length === 0 && <span className="text-gray-400">Select factions</span>}

                                {/* 👇 Images only in selected view */}
                                {value.map(faction => (
                                    <FactionImage key={faction} faction={faction} />
                                ))}
                            </div>

                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                            </span>
                        </Listbox.Button>

                        {/* OPTIONS */}
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0">
                            <Listbox.Options
                                anchor="bottom start"
                                className="z-50 mt-2 max-h-60 w-[var(--button-width)] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-[#161b22]">
                                {factionValues.map(faction => (
                                    <Listbox.Option
                                        key={faction}
                                        value={faction}
                                        className={({ active }) =>
                                            `relative cursor-pointer py-2 pr-4 pl-10 transition-colors select-none ${
                                                active
                                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                    : 'text-gray-900 dark:text-gray-200'
                                            }`
                                        }>
                                        {({ selected }) => (
                                            <>
                                                {/* 👇 Image + Name in dropdown */}
                                                <div className="flex items-center gap-3">
                                                    <FactionImage faction={faction} />
                                                    <span>{factionLookup[faction].name}</span>
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
        </div>
    );
};
