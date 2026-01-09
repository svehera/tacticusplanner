import React, { useContext, useEffect, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { ILegendaryEventSettings, LegendaryEventDefaultPage } from '@/models/interfaces';
// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

interface SettingOption {
    id: LegendaryEventDefaultPage;
    label: string;
}

const options: SettingOption[] = [
    { id: LegendaryEventDefaultPage.TEAMS, label: 'Teams' },
    { id: LegendaryEventDefaultPage.PROGRESS, label: 'Progress' },
    { id: LegendaryEventDefaultPage.TOKENOMICS, label: 'Tokenomics' },
];

const SettingGroup = ({
    title,
    currentValue,
    onChange,
}: {
    title: string;
    currentValue: LegendaryEventDefaultPage;
    onChange: (val: LegendaryEventDefaultPage) => void;
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
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:dark:bg-gray-850'
              }
                `}>
                        {opt.label}
                    </button>
                );
            })}
        </div>
    </div>
);

export const LegendaryEventSettings: React.FC = () => {
    const { leSettings } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const [defaultPageWhenEventIsActive, setDefaultPageWhenEventIsActive] = useState<LegendaryEventDefaultPage>(
        leSettings.defaultPageForActiveEvent
    );
    const [defaultPageWhenEventIsInactive, setDefaultPageWhenEventIsInactive] = useState<LegendaryEventDefaultPage>(
        leSettings.defaultPageWhenEventNotActive
    );
    const [showP2P, setShowP2P] = useState<boolean>(leSettings.showP2POptions);

    useEffect(() => {
        setDefaultPageWhenEventIsActive(leSettings.defaultPageForActiveEvent);
        setDefaultPageWhenEventIsInactive(leSettings.defaultPageWhenEventNotActive);
        setShowP2P(leSettings.showP2POptions);
    }, [leSettings]);

    const update = (settings: ILegendaryEventSettings) => {
        dispatch.leSettings({
            type: 'Set',
            value: settings,
        });
    };

    return (
        <div className="flex flex-col gap-6 p-4 max-w-3xl">
            <SettingGroup
                title="Default Page During Event"
                currentValue={defaultPageWhenEventIsActive}
                onChange={e => {
                    setDefaultPageWhenEventIsActive(e);
                    update({ ...leSettings, defaultPageForActiveEvent: e });
                }}
            />
            <SettingGroup
                title="Default Page Outside of Event"
                currentValue={defaultPageWhenEventIsInactive}
                onChange={e => {
                    setDefaultPageWhenEventIsInactive(e);
                    update({ ...leSettings, defaultPageWhenEventNotActive: e });
                }}
            />
            <div className="flex flex-col gap-3 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                    Content Visibility
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showP2P}
                        onChange={e => {
                            setShowP2P(e.target.checked);
                            update({ ...leSettings, showP2POptions: e.target.checked });
                        }}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Show Pay-to-Play (P2P) options</span>
                </label>
            </div>
        </div>
    );
};
