import React, { useMemo, useState } from 'react';

import { LeBattle } from './le-battle';
import { ILeBattles } from './le-battle.service';

interface Props {
    battles: ILeBattles;
}

export const LeBattles: React.FC<Props> = ({ battles }) => {
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
            <div className="mb-4 flex justify-around rounded-lg border border-gray-300 bg-gray-200 p-1 dark:border-gray-700 dark:bg-gray-800">
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
                            className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-center text-sm font-semibold transition-colors duration-200 ${
                                track === t
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}>
                            {t}
                        </label>
                    </React.Fragment>
                ))}
            </div>
            <div className="mb-6 rounded-lg border border-gray-300 bg-gray-200 p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase dark:text-gray-400">
                        Battle Selection
                    </h4>
                    <span className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">
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
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
                />
            </div>
            <LeBattle battle={battle} trackName={track} />
        </div>
    );
};
