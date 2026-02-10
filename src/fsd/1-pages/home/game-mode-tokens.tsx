/* eslint-disable import-x/no-internal-modules */

//import { Card, CardContent, CardHeader } from '@mui/material';

import { useState, useEffect, useContext } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { TacticusTokens } from '@/fsd/5-shared/lib/tacticus-api';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

const TokenAvailability = () => {
    const { gameModeTokens } = useContext(StoreContext);
    const [countdown, setCountdown] = useState<Record<string, number>>({});

    // Format seconds as HH:MM:SS, always using integer values
    const formatTime = (seconds: number): string => {
        seconds = Math.floor(seconds);
        if (seconds <= 0) return '00:00:00';
        const total = seconds;
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const secs = total % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Countdown timer effect (single timer for all tokens)
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
    }, [gameModeTokens]);

    useEffect(() => {
        // Single interval for all tokens
        const interval = setInterval(() => {
            setCountdown(prev => {
                const updated: Record<string, number> = {};
                Object.entries(prev).forEach(([key, value]) => {
                    updated[key] = value > 0 ? value - 1 : 0;
                });
                return updated;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

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
        bombTokens: { label: 'Bomb', icon: <MiscIcon icon={'bombToken'} width={24} height={24} /> },
    };
    // Type guard for TacticusTokens shape
    const isTacticusTokens = (value: any): value is TacticusTokens => {
        return value && typeof value === 'object' && typeof value.current === 'number' && typeof value.max === 'number';
    };

    // Filter tokens by key where value is a valid TacticusTokens object
    const tokenItems = Object.entries(gameModeTokens?.tokens ?? {})
        .filter(([_key, value]) => isTacticusTokens(value))
        .map(([key, value]) => ({
            key,
            label: tokenLabels[key]?.label ?? key,
            icon: tokenLabels[key]?.icon ?? '',
            data: value as TacticusTokens,
        }));

    if (tokenItems.length === 0) {
        return <div className="p-4 text-center text-gray-500">No token data available</div>;
    }

    return (
        <div className="border border-gray-700 bg-black/30 rounded-lg">
            <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
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
                                {item.data ? (
                                    <>
                                        <div
                                            className={`font-mono text-sm font-bold ${getStatusColor(
                                                item.data.current,
                                                item.data.max
                                            )}`}>
                                            {item.data.current}/{item.data.max}
                                            {item.data.current === item.data.max && item.data.max !== undefined && (
                                                <span className="ml-1 text-[9px] text-green-400">Full</span>
                                            )}
                                        </div>

                                        {countdown[item.key] > 0 && item.data.current < item.data.max && (
                                            <div className="text-right">
                                                <div className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
                                                    Next
                                                </div>
                                                <div className="font-mono text-[10px] text-blue-400">
                                                    {formatTime(countdown[item.key])}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="font-mono text-sm text-red-400">Invalid token data</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TokenAvailability;
