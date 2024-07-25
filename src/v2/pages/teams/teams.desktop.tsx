import React, { useContext } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Fab } from '@mui/material';
import { AddTeamDialog } from 'src/v2/features/teams/components/add-team.dialog';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { IPersonalTeam } from 'src/v2/features/teams/teams.models';
import { TeamsGrid } from 'src/v2/features/teams/components/teams-grid';
import { EditTeamDialog } from 'src/v2/features/teams/components/edit-team.dialog';

export const Teams = () => {
    const dispatch = useContext(DispatchContext);
    const { mows, characters, viewPreferences, teams } = useContext(StoreContext);
    const [openCreateTeamDialog, setOpenCreateTeamDialog] = React.useState(false);
    const [editTeam, setEditTeam] = React.useState<IPersonalTeam | null>(null);

    const addTeam = (team: IPersonalTeam) => {
        dispatch.teams({ type: 'Add', team });
    };

    const updateTeam = (team: IPersonalTeam) => {
        dispatch.teams({ type: 'Update', team });
    };

    const deleteTeam = (teamId: string) => {
        const shouldDelete = confirm('Are you sure?');
        if (shouldDelete) {
            dispatch.teams({ type: 'Delete', teamId });
        }
    };

    return (
        <>
            <Fab
                variant="extended"
                size="small"
                color="primary"
                aria-label="add"
                onClick={() => setOpenCreateTeamDialog(true)}>
                <AddIcon />
                New team
            </Fab>
            <CharactersViewContext.Provider value={viewPreferences}>
                <TeamsGrid
                    teams={teams}
                    characters={characters}
                    mows={mows}
                    editTeam={setEditTeam}
                    deleteTeam={deleteTeam}
                />

                {openCreateTeamDialog && (
                    <AddTeamDialog
                        onClose={() => setOpenCreateTeamDialog(false)}
                        characters={characters}
                        mows={mows}
                        addTeam={addTeam}
                    />
                )}

                {editTeam && (
                    <EditTeamDialog
                        team={editTeam}
                        onClose={() => setEditTeam(null)}
                        characters={characters}
                        mows={mows}
                        saveTeam={updateTeam}
                    />
                )}
            </CharactersViewContext.Provider>
        </>
    );
};
