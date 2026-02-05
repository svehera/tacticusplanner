/* eslint-disable import-x/no-internal-modules */

//import { Card, CardContent, CardHeader } from '@mui/material';

import { useState, useEffect, useContext } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { TacticusTokens } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

export default function TokenAvailability() {
    const { gameModeTokens } = useContext(StoreContext);
    const [countdown, setCountdown] = useState<Record<string, number>>({});

    // Format seconds as HH:MM:SS
    const formatTime = (seconds: number): string => {
        if (seconds <= 0) return '00:00:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Countdown timer effect
    useEffect(() => {
        if (!gameModeTokens || !gameModeTokens.tokens) return;

        // Initialize countdowns from token data
        const initial: Record<string, number> = {};
        Object.entries(gameModeTokens.tokens).forEach(([key, value]: [string, TacticusTokens | undefined]) => {
            if (value?.nextTokenInSeconds != null) {
                initial[key] = value.nextTokenInSeconds;
            }
        });
        setCountdown(initial);

        // Tick down every second
        const interval = setInterval(() => {
            setCountdown(prev => {
                const updated: Record<string, number> = {};
                Object.entries(prev).forEach(([key, value]) => {
                    if (value > 0) updated[key] = value - 1;
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [gameModeTokens]);

    // Color based on token fullness
    const getStatusColor = (current: number, max: number) => {
        const ratio = max > 0 ? current / max : 0;
        if (ratio >= 1) return 'text-green-400';
        if (ratio >= 0.5) return 'text-yellow-400';
        if (ratio > 0) return 'text-orange-400';
        return 'text-red-400';
    };

    const tokenLabels: Record<string, { label: string; icon: string | React.ReactElement }> = {
        guildRaid: { label: 'Guild Raid', icon: <MiscIcon icon={'guildRaidToken'} width={24} height={24} /> },
        arena: { label: 'Arena', icon: <MiscIcon icon={'arenaToken'} width={24} height={24} /> },
        onslaught: { label: 'Onslaught', icon: <MiscIcon icon={'onslaughtToken'} width={24} height={24} /> },
        salvageRun: { label: 'Salvage Run', icon: <MiscIcon icon={'salvageRunToken'} width={24} height={24} /> },
        bombToken: { label: 'Bomb', icon: <MiscIcon icon={'bombToken'} width={24} height={24} /> },
    };
    // Filter tokens by key where value is a token object or bombToken
    const tokenItems = Object.entries(gameModeTokens?.tokens ?? {})
        .filter(
            ([key, value]: [string, TacticusTokens | undefined]) =>
                key === 'bombToken' || (typeof value === 'object' && value && 'current' in value && 'max' in value)
        )
        .map(([key, value]: [string, TacticusTokens | undefined]) => ({
            key,
            label: tokenLabels[key]?.label ?? key,
            icon: tokenLabels[key]?.icon ?? '',
            data: value,
        }));

    if (tokenItems.length === 0) {
        return <div className="p-4 text-center text-gray-500">No token data available</div>;
    }

    return (
        <div className="border border-gray-700 bg-black/30 rounded-lg">
            <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
                <span>⚡</span>
                <h3 className="text-xs font-bold uppercase tracking-wider">Token Availability</h3>
            </div>

            <div className="p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {tokenItems.map(item => (
                        <div key={item.key} className="border border-gray-700 bg-black/50 p-2 rounded">
                            <div className="mb-1 flex items-center gap-1.5">
                                <span>{item.icon}</span>
                                <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
                                    {item.label}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div
                                    className={`font-mono text-sm font-bold ${getStatusColor(
                                        item.data?.current ?? 0,
                                        item.data?.max ?? 0
                                    )}`}>
                                    {item.data?.current ?? 0}/{item.data?.max ?? 0}
                                    {item.data?.current === item.data?.max && item.data?.max !== undefined && (
                                        <span className="ml-1 text-[9px] text-green-400">Full</span>
                                    )}
                                </div>

                                {countdown[item.key] > 0 && (item.data?.current ?? 0) < (item.data?.max ?? 0) && (
                                    <div className="text-right">
                                        <div className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
                                            Next
                                        </div>
                                        <div className="font-mono text-[10px] text-blue-400">
                                            {formatTime(countdown[item.key])}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
