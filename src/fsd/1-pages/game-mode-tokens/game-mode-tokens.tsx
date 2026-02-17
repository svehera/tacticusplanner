import { useState, useEffect, useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

// eslint-disable-next-line import-x/no-internal-modules
import { TacticusTokens } from '@/fsd/5-shared/lib/tacticus-api';

import { tokenLabels } from './game-mode-tokens.constants';

const TokenAvailability = () => {
    const { gameModeTokens } = useContext(StoreContext);
    const [countdown, setCountdown] = useState<Record<string, number>>({});

    const formatTime = (seconds: number): string => {
        const totalSeconds = Math.max(0, Math.floor(seconds));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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

    /*const getStatusColor = (current: number, max: number): string => {
    const ratio = max > 0 ? current / max : 0;
    if (ratio >= 1) return 'text-green-400';
    if (ratio >= 0.5) return 'text-yellow-400';
    if (ratio > 0) return 'text-orange-400';
    return 'text-red-400';
  };*/

    const isTacticusTokens = (value: any): value is TacticusTokens => {
        return value && typeof value === 'object' && typeof value.current === 'number' && typeof value.max === 'number';
    };

    const tokenItems = Object.entries(gameModeTokens?.tokens ?? {})
        .filter(([_key, value]) => isTacticusTokens(value))
        .map(([key, value]) => ({
            key,
            label: tokenLabels[key]?.label ?? key,
            icon: tokenLabels[key]?.icon ?? '',
            data: value as TacticusTokens,
        }));

    if (tokenItems.length === 0) {
        return <div>No token data available</div>;
    }

    return (
        <div className="text-center">
            <h2>Token Availability</h2>
            <div className="flex flex-wrap items-start justify-center gap-2.5">
                {tokenItems.map(item => (
                    <div key={item.key}>
                        <div>
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                        <div>
                            {item.data ? (
                                <>
                                    <span>
                                        {item.data.current}/{item.data.max}
                                        {item.data.current === item.data.max && (
                                            <span className="font-mono text-[10px]"> Full</span>
                                        )}
                                    </span>
                                    {countdown[item.key] > 0 && item.data.current < item.data.max && (
                                        <span>
                                            <span className="text-[10px]"> Next</span>
                                            <span className="text-[10px]"> {formatTime(countdown[item.key])}</span>
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span>Invalid token data</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TokenAvailability;
