import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import React, { useState } from 'react';

import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

interface Props {
    activeGoalsAction?: React.ReactNode;
}

export const CampaignProgressionHeader: React.FC<Props> = ({ activeGoalsAction }) => {
    const [helpOpen, setHelpOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col gap-1 border-b border-(--border) pb-3">
                <span className="text-xs text-(--muted-fg)">Plan / Campaign Progression</span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Campaign Progression</h1>
                            <IconButton
                                size="small"
                                aria-label="How to use this page"
                                onClick={() => setHelpOpen(true)}>
                                <HelpOutlineIcon fontSize="small" className="text-(--muted-fg)" />
                            </IconButton>
                        </div>
                        <p className="hidden max-w-prose text-sm text-(--muted-fg) sm:block">
                            Ranked next steps across your campaigns. Energy savings are computed against your active
                            goals and current progress.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {activeGoalsAction}
                        <SyncButton showText={true} variant="contained" />
                    </div>
                </div>
            </div>

            <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>How to Use Campaign Progression</DialogTitle>
                <DialogContent>
                    <ol className="flex flex-col gap-2 pl-4 text-sm">
                        <li>Sync with the Tacticus API. If you do, skip the next two steps.</li>
                        <li>
                            Enter your roster in the <a href="../../input/wyo">Who You Own</a> page.
                        </li>
                        <li>
                            Enter your campaign progress in the <a href="../../input/myProgress">Campaigns Progress</a>{' '}
                            page.
                        </li>
                        <li>
                            Enter your goals in the <a href="../../plan/goals">Goals</a> page.
                        </li>
                        <li>
                            Review results and adjust your goals:
                            <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
                                <li>Balance energy spent upgrading units vs beating campaign battles.</li>
                                <li>Prioritize goals with the best energy-to-savings ratio.</li>
                                <li>Mark goals complete as you progress and revisit periodically.</li>
                            </ul>
                        </li>
                    </ol>
                    <p className="mt-4 text-xs text-(--muted-fg)">
                        Bugs or feature requests? Contact cpunerd via{' '}
                        <a href="https://discord.gg/8mcWKVAYZf">Discord&apos;s Tacticus Planner channel</a>.
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
};
