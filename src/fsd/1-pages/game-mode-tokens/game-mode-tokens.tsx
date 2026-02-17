/* eslint-disable import-x/no-internal-modules */
import React, { useState, useEffect, useContext } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { TacticusTokens } from '@/fsd/5-shared/lib/tacticus-api';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/iconList';

const tokenIcons: Record<string, string> = {
    guildRaid: 'guildRaidToken',
    arena: 'arenaToken',
    onslaught: 'onslaughtToken',
    salvageRun: 'salvageRunToken',
    bombTokens: 'bombToken',
};

const tokenPulseColors: Record<string, string> = {
    guildRaid: 'rgba(255, 0, 0, 0.25)',
    arena: 'rgba(0, 0, 255, 0.25)',
    onslaught: 'rgba(255, 0, 0, 0.25)',
    salvageRun: 'rgba(0, 255, 0, 0.25)',
    bombTokens: 'rgba(255, 0, 0, 0.25)',
};

function IconPulseStyles() {
    return (
        <style>{`
          @keyframes icon-pulse {
            0%, 100% { filter: drop-shadow(0 0 10px var(--pulse-color)) drop-shadow(0 0 20px var(--pulse-color)); opacity: 1; }
            50% { filter: drop-shadow(0 0 30px var(--pulse-color)) drop-shadow(0 0 50px var(--pulse-color)); opacity: 1; }
          }
          .animate-token-pulse {
            animation: icon-pulse 2s infinite ease-in-out;
          }
        `}</style>
    );
}

function renderTokenIcon(
    iconLabel: keyof typeof tacticusIcons,
    size: number,
    shouldPulse: boolean,
    color: string
): React.ReactElement {
    return (
        <MiscIcon
            icon={iconLabel}
            width={size}
            height={size * 1.1}
            className={shouldPulse ? 'animate-token-pulse' : ''}
            style={{ '--pulse-color': color } as React.CSSProperties}
        />
    );
}

function formatTime(seconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function renderToken(
    tokenKey: string,
    tokenData: TacticusTokens,
    lastSetAtSecondsUtc: number,
    currentSecondsUtc: number
): React.ReactElement {
    if (!(tokenKey in tokenIcons)) return <></>;
    const nextTokenAtSecondsUtc = (tokenData.nextTokenInSeconds ?? 0) + lastSetAtSecondsUtc;
    let current = tokenData.current;
    let needsSync: boolean = false;
    let nextTokenInSeconds = lastSetAtSecondsUtc + (tokenData.nextTokenInSeconds ?? 0) - currentSecondsUtc;
    if (current >= tokenData.max) {
        // Tell the user that they need to sync if they're capped and it's been more than five
        // minutes since their last sync.
        if (currentSecondsUtc - lastSetAtSecondsUtc > 300) needsSync = true;
    } else if (nextTokenAtSecondsUtc < currentSecondsUtc) {
        needsSync = true;
        ++current;
        let timeSecondsUtc = nextTokenAtSecondsUtc;
        const intervalsSpanned = (currentSecondsUtc - nextTokenAtSecondsUtc) / (tokenData.regenDelayInSeconds ?? 1);
        if (intervalsSpanned >= 1) {
            const additionalTokens = Math.floor(intervalsSpanned);
            current += additionalTokens;
            timeSecondsUtc += additionalTokens * (tokenData.regenDelayInSeconds ?? 1);
            nextTokenInSeconds = timeSecondsUtc + (tokenData.regenDelayInSeconds ?? 0) - currentSecondsUtc;
        }
        current = Math.min(current, tokenData.max);
    }

    const isFull = current === tokenData.max;
    const displayCurrent = isFull ? tokenData.max : current;
    const nextTimerDisplay = isFull ? 'FULL' : formatTime(nextTokenInSeconds);

    return (
        <div key={tokenKey} className="flex w-24 min-w-[120px] flex-col items-center gap-1">
            <div className="relative flex h-10 w-full items-center justify-center">
                <div className="absolute left-1/2 -translate-x-1/2">
                    {renderTokenIcon(
                        tokenIcons[tokenKey] ?? 'defaultToken',
                        36,
                        isFull,
                        tokenPulseColors[tokenKey] ?? 'rgba(255, 255, 255, 0.25)'
                    )}
                </div>
                <div className="absolute right-0 translate-x-1 font-bold text-gray-900 drop-shadow-md dark:text-white">
                    <span>{displayCurrent}</span>
                    <span className="text-[10px] opacity-60">/{tokenData.max}</span>
                </div>
            </div>

            <div className="flex flex-col items-center leading-tight">
                <span
                    className={`text-sm tabular-nums ${
                        isFull ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                    {isFull ? 'FULL' : nextTimerDisplay}
                </span>

                {needsSync && (
                    <span className="animate-pulse text-[10px] font-bold text-amber-600 dark:text-amber-500">
                        PLEASE SYNC
                    </span>
                )}
            </div>
        </div>
    );
}

export const TokenAvailability = () => {
    const { gameModeTokens } = useContext(StoreContext);
    const [secondsUtc, setSecondsUtc] = useState(Math.floor(Date.now() / 1000));

    useEffect(() => {
        const intervalId = setInterval(() => {
            setSecondsUtc(Math.floor(Date.now() / 1000));
        }, 500);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="text-center">
            <div className="flex flex-col gap-2">
                <IconPulseStyles />
                <h2>Token Availability</h2>
                <div className="flex flex-wrap items-start justify-center gap-4 tabular-nums">
                    {Object.entries(gameModeTokens.tokens ?? {}).map(([key, token]) =>
                        renderToken(key, token, gameModeTokens.tokens!.lastSetAtSecondsUtc ?? 0, secondsUtc)
                    )}
                </div>
            </div>
        </div>
    );
};
