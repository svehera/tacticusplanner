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
    onChange: (value: LegendaryEventDefaultPage) => void;
}) => (
    <div className="flex flex-col gap-3 rounded-xl border border-(--card-border) bg-(--card) p-5 shadow-sm">
        <h3 className="mb-1 text-[10px] font-bold tracking-widest text-(--soft-fg) uppercase">{title}</h3>
        <div className="flex flex-wrap gap-2">
            {options.map(opt => {
                const isActive = currentValue === opt.id;
                return (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase transition-all duration-200 ${
                            isActive
                                ? 'border-(--primary) bg-(--primary) text-(--primary-fg) shadow-md'
                                : 'border-(--border) bg-(--soft) text-(--soft-fg) hover:bg-(--primary)/10 hover:text-(--fg)'
                        } `}>
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
        <div className="flex max-w-3xl flex-col gap-6 p-4">
            <SettingGroup
                title="Default Page During Event"
                currentValue={defaultPageWhenEventIsActive}
                onChange={event => {
                    setDefaultPageWhenEventIsActive(event);
                    update({ ...leSettings, defaultPageForActiveEvent: event });
                }}
            />
            <SettingGroup
                title="Default Page Outside of Event"
                currentValue={defaultPageWhenEventIsInactive}
                onChange={event => {
                    setDefaultPageWhenEventIsInactive(event);
                    update({ ...leSettings, defaultPageWhenEventNotActive: event });
                }}
            />
            <div className="flex flex-col gap-3 rounded-xl border border-(--card-border) bg-(--card) p-5 shadow-sm">
                <h3 className="mb-1 text-[10px] font-bold tracking-widest text-(--soft-fg) uppercase">
                    Content Visibility
                </h3>
                <label className="flex cursor-pointer items-center gap-3">
                    <input
                        type="checkbox"
                        checked={showP2P}
                        onChange={event => {
                            setShowP2P(event.target.checked);
                            update({ ...leSettings, showP2POptions: event.target.checked });
                        }}
                        className="h-5 w-5 rounded border-(--input-border) text-(--primary) focus:ring-(--ring)"
                    />
                    <span className="text-sm text-(--fg)">Show Pay-to-Play (P2P) options</span>
                </label>
            </div>
        </div>
    );
};
