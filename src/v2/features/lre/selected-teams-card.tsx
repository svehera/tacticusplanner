import { DeleteForever, Edit } from '@mui/icons-material';
import { Card, CardContent, CardHeader } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import React, { useContext } from 'react';

import { ILreTeam } from 'src/models/interfaces';
import { StoreContext } from 'src/reducers/store.provider';
import { LreTile } from 'src/v2/features/lre/lre-tile';
import { IMenuOption } from 'src/v2/models/menu-option';

interface Props {
    team: ILreTeam;
    menuItemSelect: (action: 'edit' | 'delete') => void;
}

export const SelectedTeamCard: React.FC<Props> = ({ team, menuItemSelect }) => {
    const { viewPreferences } = useContext(StoreContext);
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
                subheader={team.restrictionsIds.join(', ')}
            />
            <CardContent className="flex-box column gap1 start" style={{ minHeight: 150 }}>
                {team.characters?.map(x => <LreTile key={x.id} character={x} settings={viewPreferences} />)}
            </CardContent>
        </Card>
    );
};
