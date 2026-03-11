import { Field, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Rarity, XP_BOOK_ORDER } from '@/fsd/5-shared/model';

import { MiscIcon } from '../icons';

const bookIconName = (rarity: Rarity) => Rarity[rarity].toLowerCase() + 'Book';

export const BookSelect = ({
    label,
    value,
    valueChanges,
}: {
    label?: string;
    value: Rarity;
    valueChanges: (value: Rarity) => void;
}) => {
    return (
        <Field className="flex w-full items-center justify-between gap-4">
            {label && <Label className="font-bold whitespace-nowrap">{label}:</Label>}
            <div className="relative w-48">
                <Listbox value={value} onChange={valueChanges}>
                    <ListboxButton className="relative w-full cursor-pointer rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-3 text-left shadow-sm transition-all hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-[#0f172a] dark:text-white">
                        <div className="flex items-center gap-2">
                            <MiscIcon icon={bookIconName(value)} width={25} height={25} />
                            <span>{Rarity[value]}</span>
                        </div>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                        </span>
                    </ListboxButton>

                    <ListboxOptions
                        transition
                        className="absolute z-50 mt-2 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl transition duration-100 ease-in data-[leave]:opacity-0 dark:border-slate-700 dark:bg-[#161b22]">
                        {XP_BOOK_ORDER.map(rarity => (
                            <ListboxOption
                                key={rarity}
                                value={rarity}
                                className={({ focus }) =>
                                    `relative cursor-pointer py-2 pr-4 pl-10 transition-colors select-none ${
                                        focus
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                            : 'text-gray-900 dark:text-gray-200'
                                    }`
                                }>
                                {({ selected }) => (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <MiscIcon icon={bookIconName(rarity)} width={25} height={25} />
                                            <span>{Rarity[rarity]}</span>
                                        </div>
                                        {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                                <Check className="h-4 w-4" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Listbox>
            </div>
        </Field>
    );
};
