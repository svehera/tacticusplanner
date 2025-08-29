import { DeleteForever, Edit } from '@mui/icons-material';
import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import React, { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { ILreTeam } from '@/fsd/3-features/lre';

import { LreTile } from './lre-tile';

interface Props {
    team: ILreTeam;
    menuItemSelect: (action: 'edit' | 'delete') => void;
}

export const SelectedTeamCard: React.FC<Props> = ({ team, menuItemSelect }) => {
    const { viewPreferences } = useContext(StoreContext);
    let subheader = team.restrictionsIds.join(', ');
    if (team.points) subheader += ` (${team.points} points)`;
    if (subheader.length > 0) subheader += ' - ';
    subheader += `${team.expectedBattleClears ?? 1} battles (`;
    subheader += (team.points ?? 0) * (team.expectedBattleClears ?? 1) + ' points total)';
    return (
        <Card
            variant="outlined"
            sx={{
                minWidth: 350,
                minHeight: 200,
            }}>
            <CardHeader
                action={
                    <>
                        <IconButton onClick={() => menuItemSelect('edit')}>
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => menuItemSelect('delete')}>
                            <DeleteForever fontSize="small" />
                        </IconButton>
                    </>
                }
                title={team.name}
                subheader={subheader}
            />
            <CardContent className="flex-box column gap1 start" style={{ minHeight: 150 }}>
                {team.characters?.map(x => <LreTile key={x.id} character={x} settings={viewPreferences} />)}
            </CardContent>
        </Card>
    );
};
