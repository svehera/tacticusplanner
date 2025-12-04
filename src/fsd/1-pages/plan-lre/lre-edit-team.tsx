import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import { Checkbox, DialogActions, DialogContent, DialogTitle, FormControlLabel, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { ICharacter2 } from '@/fsd/4-entities/character';

import { ILegendaryEvent, ILreTeam } from '@/fsd/3-features/lre';

import { LreTile } from './lre-tile';

interface Props {
    lre: ILegendaryEvent;
    team: ILreTeam;
    onClose: () => void;
    saveTeam: (team: ILreTeam) => void;
    deleteTeam: (teamId: string) => void;
}

export const LreEditTeam: React.FC<Props> = ({ lre, team, onClose, saveTeam, deleteTeam }) => {
    const { viewPreferences, autoTeamsPreferences } = useContext(StoreContext);
    const [expectedBattleClears, setExpectedBattleClears] = useState<number>(team.expectedBattleClears ?? 1);
    const [expectedBattleClearsInput, setExpectedBattleClearsInput] = useState<string>(
        (team.expectedBattleClears ?? 1).toString()
    );
    const [teamName, setTeamName] = useState<string>(team.name);
    const [selectedTeam, setSelectedTeam] = useState<ICharacter2[]>(team.characters ?? []);

    const gridTeam = useMemo(
        () => lre[team.section].suggestTeam(autoTeamsPreferences, viewPreferences.onlyUnlocked, team.restrictionsIds),
        [lre, team, autoTeamsPreferences, viewPreferences]
    );

    const saveChanges = () => {
        saveTeam({
            ...team,
            name: teamName,
            charSnowprintIds: selectedTeam.map(x => x.snowprintId!),
            expectedBattleClears: expectedBattleClears,
        });
    };

    const addCharacter = (character: ICharacter2) => {
        if (selectedTeam.includes(character) || selectedTeam.length === 5) {
            return;
        }
        setSelectedTeam(curr => [...curr, character]);
    };
    const removeCharacter = (character: ICharacter2) => {
        setSelectedTeam(curr => curr.filter(c => c.id !== character.id));
    };

    const clearAll = () => {
        setSelectedTeam([]);
    };

    const addTop5 = () => {
        setSelectedTeam(gridTeam.slice(0, 5));
    };

    const isValid = () => {
        const availableCharacters = gridTeam.map(x => x.id);
        return (
            selectedTeam.length !== 0 &&
            !!teamName.length &&
            selectedTeam.every(character => availableCharacters.includes(character.id))
        );
    };

    const clampExpectedBattles = (value: number) => {
        return Math.max(1, Math.min(value, lre.battlesCount));
    };

    return (
        <Dialog open={true} fullWidth onClose={onClose} maxWidth="md" fullScreen={isMobile}>
            <DialogTitle>Edit LRE Team</DialogTitle>
            <DialogContent className="pt-2.5">
                <div className="flex-box gap10">
                    {lre[team.section].name}
                    <TextField
                        fullWidth
                        label="Team name"
                        variant="outlined"
                        value={teamName}
                        onChange={event => setTeamName(event.target.value.slice(0, 50))}
                    />
                    <TextField
                        className="w-50"
                        label="Battle Clears"
                        variant="outlined"
                        value={expectedBattleClearsInput}
                        onChange={event => {
                            const v = event.target.value;
                            // allow empty or numeric input only
                            if (/^\d*$/.test(v)) {
                                setExpectedBattleClearsInput(v);
                                const parsed = parseInt(v, 10);
                                if (!isNaN(parsed)) {
                                    setExpectedBattleClears(clampExpectedBattles(parsed));
                                }
                            }
                        }}
                        onBlur={() => {
                            // ensure the input is populated with a clamped numeric value after leaving the field
                            if (expectedBattleClearsInput === '') {
                                const clamped = clampExpectedBattles(expectedBattleClears);
                                setExpectedBattleClearsInput(clamped.toString());
                            } else {
                                const parsed = parseInt(expectedBattleClearsInput, 10);
                                const final = isNaN(parsed) ? expectedBattleClears : parsed;
                                const clamped = clampExpectedBattles(final);
                                setExpectedBattleClears(clamped);
                                setExpectedBattleClearsInput(clamped.toString());
                            }
                        }}
                        inputProps={{ min: 1, max: lre.battlesCount, step: 1 }}
                    />
                </div>
                <div className="flex-box wrap pt-2.5">
                    {lre[team.section].unitsRestrictions.map(requirement => (
                        <FormControlLabel
                            key={requirement.name}
                            control={<Checkbox disabled checked={team.restrictionsIds.includes(requirement.name)} />}
                            label={`(${requirement.points}) ${requirement.name}`}
                        />
                    ))}
                </div>

                <div className="flex-box full-width wrap start space-between">
                    <div className="min-w-[400px]">
                        <div className="flex-box gap20 space-between">
                            <h3>Selected Team ({selectedTeam.length}/5)</h3>
                            {!!selectedTeam.length && (
                                <Button variant="text" onClick={clearAll}>
                                    Clear all
                                </Button>
                            )}
                        </div>
                        <div className="flex-box column start gap-[3px] pointer">
                            {selectedTeam.length ? (
                                selectedTeam.map(character => (
                                    <div
                                        key={character.id}
                                        onClick={() => removeCharacter(character)}
                                        className="flex-box gap5 w-[350px]">
                                        {!gridTeam.some(x => x.id === character.id) && <WarningIcon color="error" />}
                                        <CloseIcon />
                                        <LreTile character={character} settings={viewPreferences} />
                                    </div>
                                ))
                            ) : (
                                <p>
                                    Choose from available characters or <Button onClick={addTop5}>Add top 5</Button>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="min-w-[400px]">
                        <h3>Available Characters ({gridTeam.length})</h3>
                        <div className="flex-box column start gap-[3px] size-[300px] overflow-auto">
                            {gridTeam.map(character => (
                                <div
                                    key={character.id}
                                    onClick={() => addCharacter(character)}
                                    style={{
                                        opacity: selectedTeam.some(x => x.id === character.id) ? 0.3 : 1,
                                    }}
                                    className="flex-box gap5 pointer w-[350px]">
                                    <AddIcon />
                                    <LreTile character={character} settings={viewPreferences} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions className="flex-box between">
                <Button color="error" variant={'contained'} onClick={() => deleteTeam(team.id)}>
                    Delete
                </Button>
                <div>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button disabled={!isValid()} variant={'contained'} onClick={saveChanges}>
                        Save
                    </Button>
                </div>
            </DialogActions>
        </Dialog>
    );
};
