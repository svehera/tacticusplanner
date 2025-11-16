import React, { useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { LeBattle } from './le-battle';
import { ILeBattles } from './le-battle.service';

interface Props {
    battles: ILeBattles;
}

const LeBattlesDesktop: React.FC<Props> = ({ battles }) => {
    return (
        <div className="flex flex-col gap-8">
            {battles.alpha.battles.map((_, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-start">
                    <div className="h-full border border-dashed border-gray-700 rounded-xl p-4 flex items-start justify-center text-gray-500">
                        <LeBattle battle={battles.alpha.battles[index]} trackName={'ALPHA'} />
                    </div>
                    <div className="h-full border border-dashed border-gray-700 rounded-xl p-4 flex items-start justify-center text-gray-500">
                        <LeBattle battle={battles.beta.battles[index]} trackName={'BETA'} />
                    </div>
                    <div className="h-full border border-dashed border-gray-700 rounded-xl p-4 flex items-start justify-center text-gray-500">
                        <LeBattle battle={battles.gamma.battles[index]} trackName={'GAMMA'} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const LeBattlesMobile: React.FC<Props> = ({ battles }) => {
    const [track, setTrack] = useState<'ALPHA' | 'BETA' | 'GAMMA'>('ALPHA');
    const [battleIndex, setBattleIndex] = useState<number>(1);

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
            <div className="mb-4 flex justify-around p-1 rounded-lg bg-gray-800 border border-gray-700">
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
                            className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded-md cursor-pointer transition-colors duration-200
                    ${track === t ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`}>
                            {t}
                        </label>
                    </React.Fragment>
                ))}
            </div>
            <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700 shadow-md">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold uppercase text-gray-400">Battle Selection</h4>
                    <span className="text-2xl font-mono font-bold text-blue-400">Battle {battleIndex + 1}</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={battles.alpha.battles.length - 1}
                    value={battleIndex}
                    onChange={e => setBattleIndex(Number(e.target.value))}
                    step="1"
                    // Basic slider styling for the dark theme
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full"
                />
            </div>
            <LeBattle battle={battle} trackName={track} />
        </div>
    );
};

export const LeBattles: React.FC<Props> = ({ battles }) => {
    return isMobile ? <LeBattlesMobile battles={battles} /> : <LeBattlesDesktop battles={battles} />;
};
