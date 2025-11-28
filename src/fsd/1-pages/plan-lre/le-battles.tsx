import React, { useContext, useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { LeBattle } from './le-battle';
import { ILeBattles } from './le-battle.service';

interface Props {
    battles: ILeBattles;
}

export const LeBattles: React.FC<Props> = ({ battles }) => {
    const { viewPreferences } = useContext(StoreContext);
    const isDarkMode = viewPreferences.theme === 'dark';
    const [track, setTrack] = useState<'ALPHA' | 'BETA' | 'GAMMA'>('ALPHA');
    const [battleIndex, setBattleIndex] = useState<number>(0);

    const battle = useMemo(() => {
        switch (track) {
            case 'ALPHA':
                return battles.alpha.battles[battleIndex];
            case 'BETA':
                return battles.beta.battles[battleIndex];
            case 'GAMMA':
                return battles.gamma.battles[battleIndex];
            default:
                return battles.alpha.battles[battleIndex];
        }
    }, [track, battleIndex, battles]);

    return (
        <div>
            <div
                className={`mb-4 flex justify-around p-1 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'} border`}>
                {['ALPHA', 'BETA', 'GAMMA'].map(t => (
                    <React.Fragment key={t}>
                        <input
                            type="radio"
                            id={`track-${t}`}
                            name="track-selection"
                            value={t}
                            checked={track === t}
                            onChange={() => setTrack(t as 'ALPHA' | 'BETA' | 'GAMMA')}
                            className="hidden"
                        />
                        <label
                            htmlFor={`track-${t}`}
                            className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded-md cursor-pointer transition-colors duration-200 ${
                                track === t
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : isDarkMode
                                      ? 'text-gray-400 hover:bg-gray-700'
                                      : 'text-gray-600 hover:bg-gray-300'
                            }`}>
                            {t}
                        </label>
                    </React.Fragment>
                ))}
            </div>
            <div
                className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'} border shadow-md`}>
                <div className="flex justify-between items-center mb-3">
                    <h4 className={`text-sm font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Battle Selection
                    </h4>
                    <span className={`text-2xl font-mono font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        Battle {battleIndex + 1}
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={battles.alpha.battles.length - 1}
                    value={battleIndex}
                    onChange={e => setBattleIndex(Number(e.target.value))}
                    step="1"
                    className={`w-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-400'} rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full`}
                />
            </div>
            <LeBattle battle={battle} trackName={track} isDarkMode={isDarkMode} />
        </div>
    );
};
