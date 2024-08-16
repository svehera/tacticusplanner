import React from 'react';
import { ILearnTeam } from 'src/v2/features/learn-teams/learn-teams.models';
import { IUnit } from 'src/v2/features/characters/characters.models';
import Dialog from '@mui/material/Dialog';
import { LearnTeamCard } from 'src/v2/features/learn-teams/components/learn-team-card';
import { isMobile } from 'react-device-detect';
import { DialogActions } from '@mui/material';
import Button from '@mui/material/Button';
import { TeamStatus } from 'src/v2/features/learn-teams/learn-teams.enums';

interface Props {
    onClose: () => void;
    moderate: (result: TeamStatus) => void;
    team: ILearnTeam;
    units: IUnit[];
    isModerator: boolean;
    onHonor: (honored: boolean) => void;
    onShare: () => void;
}

export const LearnTeamView: React.FC<Props> = ({ team, units, onClose, isModerator, moderate, onShare, onHonor }) => {
    const isPending = team.status === TeamStatus.pending;

    return (
        <Dialog open={true} onClose={onClose} fullWidth fullScreen={isMobile}>
            <LearnTeamCard units={units} team={team} fullView onHonor={onHonor} onShare={onShare} />
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                {isPending && isModerator && (
                    <>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => {
                                moderate(TeamStatus.approved);
                            }}>
                            Approve
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => {
                                moderate(TeamStatus.rejected);
                            }}>
                            Reject
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
