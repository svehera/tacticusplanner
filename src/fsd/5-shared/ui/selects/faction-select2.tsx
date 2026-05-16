/* eslint-disable boundaries/element-types */
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment } from 'react';

import { factionLookup } from '@/fsd/5-shared/lib';
import { FactionId } from '@/fsd/5-shared/model';

import { FactionImage } from '@/fsd/4-entities/faction';

export const FactionSelect2 = ({
    factionValues,
    value,
    valueChanges,
    label,
}: {
    label: string;
    factionValues: FactionId[];
    value: FactionId[];
    valueChanges: (value: FactionId[]) => void;
}) => {
    return (
        <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-(--muted-fg)">{label}</label>
            <div className="relative">
                <Listbox value={value} onChange={valueChanges} multiple>
                    <div className="relative">
                        <Listbox.Button className="relative flex min-h-10 w-full cursor-pointer items-center rounded-lg border border-(--input) bg-(--bg) py-1 pr-10 pl-3 text-left text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:ring-2 focus:ring-(--ring) focus:outline-none">
                            <div className="flex flex-wrap items-center gap-2">
                                {value.length === 0 && <span className="text-(--muted-fg)">Select factions</span>}
                                {value.map(faction => (
                                    <FactionImage key={faction} faction={faction} />
                                ))}
                            </div>

                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronsUpDown className="h-4 w-4 text-(--muted-fg)" />
                            </span>
                        </Listbox.Button>

                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0">
                            <Listbox.Options
                                anchor="bottom start"
                                className="z-50 mt-2 max-h-60 w-[var(--button-width)] overflow-auto rounded-lg border border-(--border) bg-(--overlay) py-1 shadow-xl">
                                {factionValues.map(faction => (
                                    <Listbox.Option
                                        key={faction}
                                        value={faction}
                                        className={({ active }) =>
                                            `relative cursor-pointer py-2 pr-4 pl-10 text-(--fg) transition-colors select-none ${
                                                active ? 'bg-(--primary)/10 text-(--primary)' : ''
                                            }`
                                        }>
                                        {({ selected }) => (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <FactionImage faction={faction} />
                                                    <span>{factionLookup[faction].name}</span>
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
        </div>
    );
};
