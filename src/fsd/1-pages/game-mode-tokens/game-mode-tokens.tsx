/* eslint-disable import-x/no-internal-modules */

import React, { useState, useEffect, useContext } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { TacticusTokens } from '@/fsd/5-shared/lib/tacticus-api';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import { useSyncWithTacticus } from '@/fsd/3-features/tacticus-integration/use-sync-with-tacticus';

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

function AnimationStyles() {
    return (
        <style>{`
          @keyframes icon-pulse {
            0%, 100% { filter: drop-shadow(0 0 10px var(--pulse-color)) drop-shadow(0 0 20px var(--pulse-color)); opacity: 1; }
            50% { filter: drop-shadow(0 0 30px var(--pulse-color)) drop-shadow(0 0 50px var(--pulse-color)); opacity: 1; }
          }
          .animate-token-pulse {
            animation: icon-pulse 2s infinite ease-in-out;
          }
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
          .animate-pulse-dot {
            animation: pulse-dot 1.6s ease-in-out infinite;
          }
        `}</style>
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

function formatShort(seconds: number): string {
    const t = Math.max(0, Math.floor(seconds));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    if (h === 0 && m === 0) return `${t}s`;
    if (h === 0) return `${m}m`;
    return `${h}h ${String(m).padStart(2, '0')}m`;
}

function formatStaleAge(currentSecondsUtc: number, lastSetAtSecondsUtc: number): string {
    const diffSeconds = Math.max(0, currentSecondsUtc - lastSetAtSecondsUtc);
    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return `${h}h ${m}m ago`;
}

interface TokenDerived {
    current: number;
    needsSync: boolean;
    isFull: boolean;
    nextTokenInSeconds: number;
    fullSec: number;
    cappedForSec: number;
}

function deriveToken(tokenData: TacticusTokens, lastSetAtSecondsUtc: number, currentSecondsUtc: number): TokenDerived {
    const nextTokenAtSecondsUtc = (tokenData.nextTokenInSeconds ?? 0) + lastSetAtSecondsUtc;
    let current = tokenData.current;
    let needsSync = false;
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
    const tokensNeeded = tokenData.max - current;
    const fullSec = isFull ? 0 : nextTokenInSeconds + (tokensNeeded - 1) * (tokenData.regenDelayInSeconds ?? 0);

    // cappedForSec is only meaningful when regen estimation pushed the token to max (not when
    // it was already capped at sync time). In the regen case we know the exact moment it hit
    // max, so we can show an accurate "OVER CAP +Xm". When already capped at sync the anchor
    // point is unknown, so we leave cappedForSec as 0 and suppress the duration in the UI.
    let cappedForSec = 0;
    if (isFull && tokenData.current < tokenData.max) {
        const tokensNeededAtSync = tokenData.max - tokenData.current;
        const timeHitMax =
            lastSetAtSecondsUtc +
            (tokenData.nextTokenInSeconds ?? 0) +
            (tokensNeededAtSync - 1) * (tokenData.regenDelayInSeconds ?? 0);
        cappedForSec = Math.max(0, currentSecondsUtc - timeHitMax);
    }

    return { current, needsSync, isFull, nextTokenInSeconds, fullSec, cappedForSec };
}

interface SyncBannerProps {
    currentSecondsUtc: number;
    lastSetAtSecondsUtc: number;
    onSync: () => void;
}

function SyncBanner({ currentSecondsUtc, lastSetAtSecondsUtc, onSync }: SyncBannerProps) {
    const staleAge = formatStaleAge(currentSecondsUtc, lastSetAtSecondsUtc);
    return (
        <div className="flex w-full items-center gap-3 rounded-[10px] border border-amber-400/35 bg-amber-400/10 px-3.5 py-2.5 text-amber-400">
            <span className="animate-pulse-dot inline-block size-2 shrink-0 rounded-full bg-amber-400 [box-shadow:0_0_8px_#f59e0b]" />
            <span className="text-[11px] font-bold tracking-[1.2px] uppercase">Refresh Required</span>
            <span className="text-xs font-medium opacity-70">Last sync {staleAge}</span>
            <span className="flex-1" />
            <button
                className="rounded-md bg-amber-400 px-3 py-[5px] text-[11px] font-bold tracking-[1.2px] text-zinc-900 uppercase"
                onClick={onSync}>
                Sync now
            </button>
        </div>
    );
}

interface TokenCardProps {
    tokenKey: string;
    tokenData: TacticusTokens;
    lastSetAtSecondsUtc: number;
    currentSecondsUtc: number;
}

function TokenCard({ tokenKey, tokenData, lastSetAtSecondsUtc, currentSecondsUtc }: TokenCardProps) {
    const { current, isFull, nextTokenInSeconds, fullSec, cappedForSec } = deriveToken(
        tokenData,
        lastSetAtSecondsUtc,
        currentSecondsUtc
    );

    const displayCurrent = isFull ? tokenData.max : current;
    const pct = displayCurrent / tokenData.max;

    // Hide cap caption when max === 1 and not full (next-token time = full-cap time, so text would be duplicate)
    const showCapCaption = !(tokenData.max === 1 && !isFull);

    return (
        <div className="flex w-auto flex-col items-center gap-1 rounded-xl border border-(--card-border) bg-(--card-bg) px-3 pt-3.5 pb-3 shadow-sm sm:w-[124px]">
            <MiscIcon
                icon={(tokenIcons[tokenKey] ?? 'defaultToken') as keyof typeof tacticusIcons}
                width={48}
                height={48 * 1.1}
                className={isFull ? 'animate-token-pulse' : ''}
                style={
                    {
                        '--pulse-color': tokenPulseColors[tokenKey] ?? 'rgba(255, 255, 255, 0.25)',
                    } as React.CSSProperties
                }
            />
            <span className="text-[10px] font-bold tracking-[1.2px] text-(--muted-fg) uppercase">
                {tokenNames[tokenKey]}
            </span>
            <span className="text-[20px] leading-none font-extrabold text-(--fg) tabular-nums">
                {displayCurrent}
                <span className="text-xs font-medium text-(--muted-fg)">/{tokenData.max}</span>
            </span>
            <span className={`text-sm font-semibold tabular-nums ${isFull ? 'text-red-300' : 'text-(--fg)'}`}>
                {isFull ? 'CAPPED' : formatTime(nextTokenInSeconds)}
            </span>

            {/* Progress bar */}
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/8">
                <div
                    className={`h-full bg-gradient-to-r transition-[width] duration-500 ease-out ${isFull ? 'from-red-500 to-rose-400' : 'from-indigo-400 to-violet-400'}`}
                    style={{ width: `${pct * 100}%` }}
                />
            </div>

            {/* FULL IN caption — hidden when max===1 (next token = full, same timer) */}
            {!isFull && showCapCaption && (
                <span className="mt-1 text-[10px] font-semibold tracking-[1px] text-slate-400 uppercase">
                    FULL IN {formatShort(fullSec)}
                </span>
            )}
            {/* OVER CAP caption — only when regen estimation capped the token (accurate duration known) */}
            {isFull && cappedForSec > 0 && (
                <span className="mt-1 text-[10px] font-semibold tracking-[1px] text-red-300 uppercase">
                    OVER CAP +{formatShort(cappedForSec)}
                </span>
            )}
        </div>
    );
}

export const TokenAvailability = () => {
    const { gameModeTokens } = useContext(StoreContext);
    const [secondsUtc, setSecondsUtc] = useState(Math.floor(Date.now() / 1000));
    const { syncWithTacticus } = useSyncWithTacticus();

    useEffect(() => {
        const intervalId = setInterval(() => {
            setSecondsUtc(Math.floor(Date.now() / 1000));
        }, 500);

        return () => clearInterval(intervalId);
    }, []);

    const lastSetAtSecondsUtc = gameModeTokens.tokens?.lastSetAtSecondsUtc ?? 0;

    const tokenEntries = (Object.entries(gameModeTokens.tokens ?? {}) as [string, TacticusTokens][]).filter(
        ([key]) => key in tokenIcons
    );

    const anyNeedsSync = tokenEntries.some(
        ([, token]) => deriveToken(token, lastSetAtSecondsUtc, secondsUtc).needsSync
    );

    return (
        <div className="flex flex-col items-center gap-3">
            <AnimationStyles />
            <p className="text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                Token Availability
            </p>
            {/* Inner wrapper constrains the banner width to match the cards row */}
            <div className="flex w-fit flex-col gap-3">
                {anyNeedsSync && (
                    <SyncBanner
                        currentSecondsUtc={secondsUtc}
                        lastSetAtSecondsUtc={lastSetAtSecondsUtc}
                        onSync={syncWithTacticus}
                    />
                )}
                <div className="flex flex-wrap items-start justify-center gap-3 tabular-nums">
                    {tokenEntries.map(([key, token]) => (
                        <TokenCard
                            key={key}
                            tokenKey={key}
                            tokenData={token}
                            lastSetAtSecondsUtc={lastSetAtSecondsUtc}
                            currentSecondsUtc={secondsUtc}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
