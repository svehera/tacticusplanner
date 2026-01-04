import React, { useState } from 'react';

interface SettingOption {
    id: string;
    label: string;
}

export const LegendaryEventSettings: React.FC = () => {
    const [defaultPageWhenEventIsActive, setDefaultPageWhenEventIsActive] = useState('tokenomics');
    const [defaultPageWhenEventIsInactive, setDefaultPageWhenEventIsInactive] = useState('teams');
    const [showP2P, setShowP2P] = useState<boolean>(true);

    const options: SettingOption[] = [
        { id: 'teams', label: 'Teams' },
        { id: 'progress', label: 'Progress' },
        { id: 'tokenomics', label: 'Tokenomics' },
    ];

    const SettingGroup = ({
        title,
        currentValue,
        onChange,
    }: {
        title: string;
        currentValue: string;
        onChange: (val: string) => void;
    }) => (
        <div className="flex flex-col gap-3 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                {title}
            </h3>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const isActive = currentValue === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => onChange(opt.id)}
                            className={`
              px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all duration-200 border
              ${
                  isActive
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750'
              }
                `}>
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 p-4 max-w-3xl">
            <SettingGroup
                title="Default Page During Event"
                currentValue={defaultPageWhenEventIsActive}
                onChange={setDefaultPageWhenEventIsActive}
            />
            <SettingGroup
                title="Default Page Outside of Event"
                currentValue={defaultPageWhenEventIsInactive}
                onChange={setDefaultPageWhenEventIsInactive}
            />
            <div className="flex flex-col gap-3 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Content Visibility
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showP2P}
                        onChange={e => setShowP2P(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Show Pay-to-Play (P2P) options</span>
                </label>
            </div>
        </div>
    );
};
