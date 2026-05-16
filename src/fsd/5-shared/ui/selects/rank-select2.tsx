import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment } from 'react';

import { Rank } from '@/fsd/5-shared/model';
import { RankIcon } from '@/fsd/5-shared/ui/icons';

export const RankSelect2 = ({
    rankValues,
    value,
    valueChanges,
    label,
    hideText = false,
}: {
    label: string;
    rankValues: number[];
    value: number;
    valueChanges: (value: number) => void;
    hideText?: boolean;
}) => {
    return (
        <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-(--muted-fg)">{label}</label>

            <Listbox value={value} onChange={valueChanges}>
                <div className="relative">
                    <Listbox.Button className="relative flex h-10 w-full cursor-pointer items-center rounded-lg border border-(--input) bg-(--bg) pr-10 pl-3 text-left text-(--fg) shadow-sm transition-all hover:border-(--primary) focus:ring-2 focus:ring-(--ring) focus:outline-none">
                        <div className="flex items-center gap-2">
                            <RankIcon rank={value} />
                            {!hideText && <span>{Rank[value]}</span>}
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
                        <Listbox.Options className="absolute z-50 mt-2 max-h-[min(60vh,24rem)] w-full overflow-y-auto overscroll-contain rounded-lg border border-(--border) bg-(--overlay) py-1 shadow-xl">
                            {rankValues.map(rank => (
                                <Listbox.Option
                                    key={rank}
                                    value={rank}
                                    className={({ active }) =>
                                        `relative cursor-pointer py-2 pr-4 pl-10 text-(--fg) transition-colors select-none ${
                                            active ? 'bg-(--primary)/10 text-(--primary)' : ''
                                        }`
                                    }>
                                    {({ selected }) => (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <RankIcon rank={rank} />
                                                {!hideText && <span>{Rank[rank]}</span>}
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
