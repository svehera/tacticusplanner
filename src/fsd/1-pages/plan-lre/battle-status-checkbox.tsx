import { Popover, TextField } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { RequirementStatus } from '@/fsd/3-features/lre';

import { STATUS_COLORS, STATUS_LABELS } from './requirement-status-constants';

interface Props {
    status: RequirementStatus;
    score?: number;
    scoreType: 'killScore' | 'highScore';
    maxScore: number;
    onChange: (status: RequirementStatus, score?: number) => void;
}

export const BattleStatusCheckbox: React.FC<Props> = ({ status, score, scoreType, maxScore, onChange }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [scoreInput, setScoreInput] = useState<string>(String(score || ''));
    const [pendingStatus, setPendingStatus] = useState<RequirementStatus | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const scoreLabel = scoreType === 'killScore' ? 'Kill Score' : 'High Score';

    const handleStatusClick = (newStatus: RequirementStatus) => {
        setShowDropdown(false);

        // If switching to PartiallyCleared, show popover for input
        if (newStatus === RequirementStatus.PartiallyCleared) {
            // Store the pending status and show popover
            setPendingStatus(newStatus);
            setAnchorEl(dropdownRef.current);
            return;
        }

        // Clear score when switching to any other status
        onChange(newStatus, undefined);
    };

    const toggleDropdown = () => {
        if (!showDropdown && buttonRef.current) {
            // Calculate if dropdown should open upwards or downwards
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;
            const dropdownHeight = 200; // Estimated dropdown height

            // Open upwards if there's not enough space below
            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                setDropdownPosition('top');
            } else {
                setDropdownPosition('bottom');
            }
        }
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

    const handleScoreSubmit = () => {
        const parsedScore = parseInt(scoreInput);
        if (!isNaN(parsedScore) && parsedScore >= 0) {
            // Cap the score at maxScore
            const cappedScore = Math.min(parsedScore, maxScore);
            onChange(RequirementStatus.PartiallyCleared, cappedScore);
        }
        setPendingStatus(null);
        setAnchorEl(null);
    };

    const handlePopoverClose = () => {
        // If they cancel, don't change the status
        setPendingStatus(null);
        setAnchorEl(null);
        setScoreInput(String(score || ''));
    };

    // Build select options including PartiallyCleared for score requirements
    const getStatusOptions = () => {
        const options = [
            { value: RequirementStatus.NotCleared, label: STATUS_LABELS[RequirementStatus.NotCleared] },
            { value: RequirementStatus.Cleared, label: STATUS_LABELS[RequirementStatus.Cleared] },
            { value: RequirementStatus.MaybeClear, label: STATUS_LABELS[RequirementStatus.MaybeClear] },
            { value: RequirementStatus.StopHere, label: STATUS_LABELS[RequirementStatus.StopHere] },
        ];

        options.push({
            value: RequirementStatus.PartiallyCleared,
            label: score ? `${score}` : STATUS_LABELS[RequirementStatus.PartiallyCleared],
        });

        return options;
    };

    // Use pendingStatus while popover is open, otherwise use actual status
    const displayStatus = pendingStatus ?? status;

    return (
        <>
            <div className="relative inline-block" ref={dropdownRef}>
                <button
                    ref={buttonRef}
                    onClick={toggleDropdown}
                    className="p-1 md:p-1.5 text-sm md:text-base font-bold text-center size-8 md:size-10 border-2 rounded"
                    style={{
                        color: STATUS_COLORS[displayStatus],
                        borderColor: `${STATUS_COLORS[displayStatus]}20`,
                    }}>
                    {score && status === RequirementStatus.PartiallyCleared ? (
                        <span className="text-xs md:text-sm">{score}</span>
                    ) : (
                        STATUS_LABELS[displayStatus]
                    )}
                </button>

                {showDropdown && (
                    <div
                        className="absolute z-10 bg-white border border-gray-300 rounded shadow-lg dark:bg-gray-800 dark:border-gray-600"
                        style={
                            dropdownPosition === 'top'
                                ? { bottom: '100%', marginBottom: '4px' }
                                : { top: '100%', marginTop: '4px' }
                        }>
                        {getStatusOptions().map(option => (
                            <button
                                key={option.value}
                                onClick={() => handleStatusClick(option.value)}
                                className="flex items-center justify-center w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                style={{
                                    color: STATUS_COLORS[option.value],
                                }}>
                                {option.label}
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
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>
                        Enter {scoreLabel} (Max: {maxScore})
                    </div>
                    <TextField
                        autoFocus
                        size="small"
                        type="number"
                        label={scoreLabel}
                        value={scoreInput}
                        onChange={e => setScoreInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                handleScoreSubmit();
                            }
                        }}
                        slotProps={{ htmlInput: { min: 0, max: maxScore } }}
                        helperText={`Maximum points for this battle: ${maxScore}`}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={handlePopoverClose} style={{ padding: '4px 12px' }}>
                            Cancel
                        </button>
                        <button
                            onClick={handleScoreSubmit}
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
