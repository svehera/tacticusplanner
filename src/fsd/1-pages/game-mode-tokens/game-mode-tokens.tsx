/* eslint-disable import-x/no-internal-modules */
import React, { useState, useEffect, useContext } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { TacticusTokens } from '@/fsd/5-shared/lib/tacticus-api';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

const tokenIcons: Record<string, string> = {
    guildRaid: 'guildRaidToken',
    arena: 'arenaToken',
    onslaught: 'onslaughtToken',
    salvageRun: 'salvageRunToken',
    bombTokens: 'bombToken',
};

const tokenNames: Record<string, string> = {
    guildRaid: 'Guild Raid',
    arena: 'Arena',
    onslaught: 'Onslaught',
    salvageRun: 'Salvage Run',
    bombTokens: 'Bomb',
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
            nextTokenInSeconds = timeSecondsUtc + (tokenData.regenDelayInSeconds ?? 1) - currentSecondsUtc;
        }
        current = Math.min(current, tokenData.max);
    }

    const isFull = current === tokenData.max;
    const displayCurrent = isFull ? tokenData.max : current;
    const nextTimerDisplay = isFull ? 'FULL' : formatTime(nextTokenInSeconds);

    return (
        <div
            key={tokenKey}
            className="flex w-auto flex-col items-center gap-2 rounded-xl border border-(--card-border) bg-(--card-bg) px-3 py-3 shadow-sm sm:w-[120px] sm:px-4">
            {renderTokenIcon(
                tokenIcons[tokenKey] ?? 'defaultToken',
                48,
                isFull,
                tokenPulseColors[tokenKey] ?? 'rgba(255, 255, 255, 0.25)'
            )}

            <div className="flex flex-col items-center leading-tight">
                <span className="text-xs font-semibold tracking-wide text-(--muted-fg) uppercase">
                    {tokenNames[tokenKey]}
                </span>
                <span className="font-bold text-(--fg) tabular-nums">
                    {displayCurrent}
                    <span className="text-xs font-normal opacity-60">/{tokenData.max}</span>
                </span>
                <span
                    className={`text-sm tabular-nums ${
                        isFull ? 'text-red-600 dark:text-red-400' : 'text-(--muted-fg)'
                    }`}>
                    {isFull ? 'FULL' : nextTimerDisplay}
                </span>
                <span
                    className={`text-[10px] font-bold ${needsSync ? 'animate-pulse text-amber-600 dark:text-amber-500' : 'invisible'}`}>
                    PLEASE SYNC
                </span>
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
        <div className="flex flex-col items-center gap-3">
            <IconPulseStyles />
            <p className="text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                Token Availability
            </p>
            <div className="flex flex-wrap items-start justify-center gap-3 tabular-nums">
                {Object.entries(gameModeTokens.tokens ?? {})
                    .filter(([key]) => key in tokenIcons)
                    .map(([key, token]) =>
                        renderToken(key, token, gameModeTokens.tokens!.lastSetAtSecondsUtc ?? 0, secondsUtc)
                    )}
            </div>
        </div>
    );
};
