/* eslint-disable import-x/no-internal-modules */
import React, { useState, useEffect, useContext } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { TacticusTokens } from '@/fsd/5-shared/lib/tacticus-api';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

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
        0%, 100% { filter: drop-shadow(0 0 2px var(--pulse-color)); opacity: 1,0; }
        50% { filter: drop-shadow(0 0 12px var(--pulse-color)); opacity: 1; }
      }
    .animate-token-pulse {
      animation: icon-pulse 2s infinite ease-in-out;
    }
  `}</style>
    );
}

function renderTokenIcon(iconLabel: string, size: number, shouldPulse: boolean, color: string): React.ReactElement {
    return (
        <>
            <IconPulseStyles />
            <MiscIcon
                icon={iconLabel as any}
                width={size}
                height={size}
                className={shouldPulse ? 'animate-token-pulse' : ''}
                style={{ '--pulse-color': color } as React.CSSProperties}
            />
        </>
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
    countdown: Record<string, number>
): React.ReactElement {
    const remainingSeconds = countdown[tokenKey] ?? 0;

    let bonusTokens = 0;

    if (tokenData.nextTokenInSeconds !== null && tokenData.current < tokenData.max) {
        if (remainingSeconds <= 0) {
            // The first token in the chamber finished.
            bonusTokens = 1;

            // Note: If your countdown state doesn't automatically loop,
            // you might want to handle multiple regens here, but usually,
            // a fresh sync from the DB/Store is better for long gaps.
        }
    }

    const displayCurrent = Math.min(tokenData.max, tokenData.current + bonusTokens);
    const isFull = displayCurrent >= tokenData.max;

    return (
        <div key={tokenKey} className="flex w-24 min-w-[120px] flex-col items-center gap-2">
            <div className="relative flex h-10 w-full items-center justify-center">
                <div className="absolute left-1/2 -translate-x-1/2">
                    {renderTokenIcon(
                        tokenIcons[tokenKey] ?? 'defaultToken',
                        36,
                        displayCurrent >= tokenData.max,
                        tokenPulseColors[tokenKey] ?? 'rgba(255, 255, 255, 0.25)'
                    )}
                </div>
                <div className="absolute right-0 translate-x-1 font-bold text-white drop-shadow-md">
                    <span>{displayCurrent}</span>
                    <span className="text-[10px] opacity-60">/{tokenData.max}</span>
                </div>
            </div>

            <div className={`text-center text-sm tabular-nums ${isFull ? 'text-red-400' : 'text-gray-300'}`}>
                {isFull ? 'FULL' : remainingSeconds > 0 ? formatTime(remainingSeconds) : 'PLEASE SYNC'}
            </div>
        </div>
    );
}

export const TokenAvailability = () => {
    const { gameModeTokens } = useContext(StoreContext);
    const [countdown, setCountdown] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!gameModeTokens?.tokens) return;

        const initialCountdown: Record<string, number> = {};
        Object.entries(gameModeTokens.tokens).forEach(([key, value]) => {
            if (value?.nextTokenInSeconds != null) {
                initialCountdown[key] = value.nextTokenInSeconds;
            }
        });
        setCountdown(initialCountdown);
    }, [gameModeTokens?.tokens]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => {
                const updatedCountdown: Record<string, number> = {};
                Object.entries(prev).forEach(([key, value]) => {
                    updatedCountdown[key] = Math.max(0, value - 1);
                });
                return updatedCountdown;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-center">
            <div className="flex flex-col gap-2">
                <h2>Token Availability</h2>
                <div className="flex flex-wrap items-center items-start justify-center gap-4 tabular-nums">
                    {Object.entries(gameModeTokens.tokens ?? {}).map(([key, token]) =>
                        renderToken(key, token, countdown)
                    )}
                </div>
            </div>
        </div>
    );
};
