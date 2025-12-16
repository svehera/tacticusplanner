import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import { Fab, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';
import { useDebounceValue } from 'usehooks-ts';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { MowsService } from '@/fsd/4-entities/mow';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { AddTeamDialog } from '@/fsd/3-features/teams/components/add-team.dialog';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { EditTeamDialog } from '@/fsd/3-features/teams/components/edit-team.dialog';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TeamsGrid } from '@/fsd/3-features/teams/components/teams-grid';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { allModes } from '@/fsd/3-features/teams/teams.constants';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IPersonalTeam } from '@/fsd/3-features/teams/teams.models';

export const Teams = () => {
    const dispatch = useContext(DispatchContext);
    const { mows, characters, viewPreferences, teams } = useContext(StoreContext);
    const [quickFilter, setQuickFilter] = useDebounceValue('', 300);
    const [openCreateTeamDialog, setOpenCreateTeamDialog] = React.useState(false);
    const [editTeam, setEditTeam] = React.useState<IPersonalTeam | null>(null);

    const resolvedMows = MowsService.resolveAllFromStorage(mows);

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

    const filteredTeams = useMemo(() => {
        const searchTerm = quickFilter.toLowerCase();

        if (!searchTerm) {
            return teams;
        }

        return teams.filter(team => {
            const nameMatched = () => team.name.toLowerCase().includes(searchTerm);
            const modeMatched = () => {
                const modsNames = team.subModes.map(mod =>
                    (allModes.find(x => x.value === mod)?.label ?? '').toLowerCase()
                );
                return modsNames.some(mod => mod.includes(searchTerm));
            };

            return nameMatched() || modeMatched();
        });
    }, [teams, quickFilter]);

    return (
        <>
            <div className="flex gap-3 items-center">
                <Button
                    size="small"
                    variant={'contained'}
                    component={Link}
                    to={isMobile ? '/mobile/learn/guides' : '/learn/guides'}>
                    <LinkIcon /> <span className="pl-[5px]">Go to Guides</span>
                </Button>

                <Fab
                    variant="extended"
                    size="small"
                    color="primary"
                    aria-label="add"
                    onClick={() => setOpenCreateTeamDialog(true)}>
                    <AddIcon />
                    New team
                </Fab>
                <TextField
                    size="small"
                    sx={{ margin: '10px', width: '220px' }}
                    label="Quick Search"
                    variant="outlined"
                    onChange={event => setQuickFilter(event.target.value)}
                />
            </div>
            <CharactersViewContext.Provider value={viewPreferences}>
                <TeamsGrid
                    teams={filteredTeams}
                    characters={characters}
                    mows={resolvedMows}
                    editTeam={setEditTeam}
                    deleteTeam={deleteTeam}
                />

                {openCreateTeamDialog && (
                    <AddTeamDialog
                        onClose={() => setOpenCreateTeamDialog(false)}
                        characters={characters}
                        mows={resolvedMows}
                        addTeam={addTeam}
                    />
                )}

                {editTeam && (
                    <EditTeamDialog
                        team={editTeam}
                        onClose={() => setEditTeam(null)}
                        characters={characters}
                        mows={resolvedMows}
                        saveTeam={updateTeam}
                    />
                )}
            </CharactersViewContext.Provider>
        </>
    );
};
