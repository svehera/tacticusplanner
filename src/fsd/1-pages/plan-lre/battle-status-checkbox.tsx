import { Popover, TextField } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { RequirementStatus } from '@/fsd/3-features/lre';

import { STATUS_COLORS, STATUS_LABELS } from './requirement-status-constants';

interface Props {
    status: RequirementStatus;
    killScore?: number;
    isKillScore: boolean;
    maxKillPoints: number;
    onChange: (status: RequirementStatus, killScore?: number) => void;
}

export const BattleStatusCheckbox: React.FC<Props> = ({ status, killScore, isKillScore, maxKillPoints, onChange }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [killScoreInput, setKillScoreInput] = useState<string>(String(killScore || ''));
    const [pendingStatus, setPendingStatus] = useState<RequirementStatus | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleStatusClick = (newStatus: RequirementStatus) => {
        setShowDropdown(false);

        // If switching to PartiallyCleared and it's kill score, show popover for input
        if (newStatus === RequirementStatus.PartiallyCleared && isKillScore) {
            // Store the pending status and show popover
            setPendingStatus(newStatus);
            setAnchorEl(dropdownRef.current);
            return;
        }

        // Clear killScore when switching away from PartiallyCleared
        const newKillScore = newStatus === RequirementStatus.PartiallyCleared ? killScore : undefined;
        onChange(newStatus, newKillScore);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleKillScoreSubmit = () => {
        const score = parseInt(killScoreInput);
        if (!isNaN(score) && score >= 0) {
            // Cap the score at maxKillPoints
            const cappedScore = Math.min(score, maxKillPoints);
            onChange(RequirementStatus.PartiallyCleared, cappedScore);
        }
        setPendingStatus(null);
        setAnchorEl(null);
    };

    const handlePopoverClose = () => {
        // If they cancel, don't change the status
        setPendingStatus(null);
        setAnchorEl(null);
        setKillScoreInput(String(killScore || ''));
    };

    // Build select options (exclude PartiallyCleared if not a kill score requirement)
    const getStatusOptions = () => {
        const options = [
            { value: RequirementStatus.NotCleared, label: STATUS_LABELS[RequirementStatus.NotCleared] },
            { value: RequirementStatus.Cleared, label: STATUS_LABELS[RequirementStatus.Cleared] },
            { value: RequirementStatus.MaybeClear, label: STATUS_LABELS[RequirementStatus.MaybeClear] },
            { value: RequirementStatus.StopHere, label: STATUS_LABELS[RequirementStatus.StopHere] },
        ];

        if (isKillScore) {
            options.push({
                value: RequirementStatus.PartiallyCleared,
                label: killScore ? `${killScore}` : STATUS_LABELS[RequirementStatus.PartiallyCleared],
            });
        }

        return options;
    };

    // Use pendingStatus while popover is open, otherwise use actual status
    const displayStatus = pendingStatus ?? status;

    return (
        <>
            <div className="relative inline-block" ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    className="p-1 md:p-1.5 text-sm md:text-base font-bold text-center size-8 md:size-10 border-2 rounded"
                    style={{
                        color: STATUS_COLORS[displayStatus],
                        borderColor: `${STATUS_COLORS[displayStatus]}20`,
                    }}>
                    {killScore && status === RequirementStatus.PartiallyCleared ? (
                        <span className="text-xs md:text-sm">{killScore}</span>
                    ) : (
                        STATUS_LABELS[displayStatus]
                    )}
                </button>

                {showDropdown && (
                    <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded shadow-lg dark:bg-gray-800 dark:border-gray-600">
                        {getStatusOptions().map(option => (
                            <button
                                key={option.value}
                                onClick={() => handleStatusClick(option.value)}
                                className="flex items-center justify-center w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                style={{
                                    color: STATUS_COLORS[option.value],
                                }}>
                                {typeof option.label === 'string' ? option.label : option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>Enter Kill Score (Max: {maxKillPoints})</div>
                    <TextField
                        autoFocus
                        size="small"
                        type="number"
                        label="Kill Score"
                        value={killScoreInput}
                        onChange={e => setKillScoreInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                handleKillScoreSubmit();
                            }
                        }}
                        slotProps={{ htmlInput: { min: 0, max: maxKillPoints } }}
                        helperText={`Maximum kill points for this battle: ${maxKillPoints}`}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={handlePopoverClose} style={{ padding: '4px 12px' }}>
                            Cancel
                        </button>
                        <button
                            onClick={handleKillScoreSubmit}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                            }}>
                            Save
                        </button>
                    </div>
                </div>
            </Popover>
        </>
    );
};
