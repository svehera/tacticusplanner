import React, { useContext } from 'react';
import { ILreTeam } from 'src/models/interfaces';
import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { DeleteForever, Edit } from '@mui/icons-material';
import { LreTile } from 'src/v2/features/lre/lre-tile';
import { StoreContext } from 'src/reducers/store.provider';

interface Props {
    team: ILreTeam;
}

export const SelectedTeamCard: React.FC<Props> = ({ team }) => {
    const { viewPreferences } = useContext(StoreContext);
    const menuItemSelect = (action: string) => {};

    return (
        <Card
            variant="outlined"
            sx={{
                width: 400,
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
                subheader={team.restrictionsIds.join(', ')}
            />
            <CardContent className="flex-box column start" style={{ minHeight: 150 }}>
                {team.characters?.map(x => <LreTile key={x.id} character={x} settings={viewPreferences} />)}
            </CardContent>
        </Card>
    );
};
