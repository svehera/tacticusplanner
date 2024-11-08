import React, { useContext, useMemo, useState } from 'react';

import { ICharacter2, ILegendaryEvent, ILreTeam, LreTrackId } from 'src/models/interfaces';
import { isMobile } from 'react-device-detect';
import {
    Checkbox,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    TextField,
} from '@mui/material';
import { LreTile } from 'src/v2/features/lre/lre-tile';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { IMenuOption } from 'src/v2/models/menu-option';
import { StoreContext } from 'src/reducers/store.provider';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import AddIcon from '@mui/icons-material/Add';

interface Props {
    lre: ILegendaryEvent;
    preselectedTrackId: LreTrackId;
    preselectedRequirements: string[];
    onClose: () => void;
    addTeam: (team: ILreTeam) => void;
}

export const LreAddTeam: React.FC<Props> = ({ lre, preselectedTrackId, preselectedRequirements, onClose, addTeam }) => {
    const { viewPreferences, autoTeamsPreferences } = useContext(StoreContext);
    const trackOptions: IMenuOption[] = [
        {
            value: lre.alpha.section,
            label: lre.alpha.name,
            selected: false,
        },
        {
            value: lre.beta.section,
            label: lre.beta.name,
            selected: false,
        },
        {
            value: lre.gamma.section,
            label: lre.gamma.name,
            selected: false,
        },
    ];
    const [teamName, setTeamName] = useState<string>(preselectedTrackId);
    const [trackId, setTrackId] = useState<LreTrackId>(preselectedTrackId);
    const [restrictions, setRestrictions] = useState<string[]>(preselectedRequirements);
    const [selectedTeam, setSelectedTeam] = useState<ICharacter2[]>([]);

    const gridTeam = useMemo(
        () => lre[trackId].suggestTeam(autoTeamsPreferences, viewPreferences.onlyUnlocked, restrictions),
        [restrictions, trackId]
    );

    const handleChange = (checked: boolean, name: string) => {
        if (checked) {
            setRestrictions(curr => [...curr, name]);
        } else {
            setRestrictions(curr => curr.filter(r => r !== name));
        }
    };

    const saveChanges = () => {
        addTeam({
            id: '',
            name: teamName,
            section: trackId,
            characters: selectedTeam,
            charactersIds: selectedTeam.map(x => x.id),
            restrictionsIds: restrictions,
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

    const updateSelectedTrack = (value: string[]) => {
        setTrackId(value[0] as LreTrackId);
        setRestrictions([]);
        setSelectedTeam([]);
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

    return (
        <Dialog open={true} fullWidth onClose={onClose} maxWidth="md" fullScreen={isMobile}>
            <DialogTitle>Add LRE Team</DialogTitle>
            <DialogContent style={{ paddingTop: '10px' }}>
                <div className="flex-box gap10">
                    <MultipleSelect
                        label="Track"
                        selected={[trackId]}
                        options={trackOptions}
                        multiple={false}
                        optionsChange={updateSelectedTrack}
                    />
                    <TextField
                        fullWidth
                        label="Team name"
                        variant="outlined"
                        value={teamName}
                        onChange={event => setTeamName(event.target.value.slice(0, 50))}
                    />
                </div>
                <div className="flex-box wrap" style={{ paddingTop: '10px' }}>
                    {lre[trackId].unitsRestrictions.map(requirement => (
                        <FormControlLabel
                            key={requirement.name}
                            control={
                                <Checkbox
                                    checked={restrictions.includes(requirement.name)}
                                    onChange={event => handleChange(event.target.checked, requirement.name)}
                                    inputProps={{ 'aria-label': 'controlled' }}
                                />
                            }
                            label={`(${requirement.points}) ${requirement.name}`}
                        />
                    ))}
                </div>

                <div className="flex-box full-width wrap start space-between">
                    <div style={{ minWidth: 400 }}>
                        <div className="flex-box gap20 space-between">
                            <h3>Selected Team ({selectedTeam.length}/5)</h3>
                            {!!selectedTeam.length && (
                                <Button variant="text" onClick={clearAll}>
                                    Clear all
                                </Button>
                            )}
                        </div>
                        <div className="flex-box column start gap3 pointer">
                            {selectedTeam.length ? (
                                selectedTeam.map(character => (
                                    <div
                                        key={character.id}
                                        onClick={() => removeCharacter(character)}
                                        className="flex-box gap5"
                                        style={{ width: 350 }}>
                                        {!gridTeam.some(c => selectedTeam.some(x => x.id === c.id)) && (
                                            <WarningIcon color="error" />
                                        )}
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

                    <div style={{ minWidth: 400 }}>
                        <h3>Available Characters ({gridTeam.length})</h3>
                        <div
                            className="flex-box column start gap3"
                            style={{ minHeight: 300, maxHeight: 300, overflow: 'auto' }}>
                            {gridTeam.map((character, index) => (
                                <div
                                    key={character.id}
                                    onClick={() => addCharacter(character)}
                                    style={{
                                        opacity: selectedTeam.some(x => x.id === character.id) ? 0.3 : 1,
                                        width: 350,
                                    }}
                                    className="flex-box gap5 pointer">
                                    <AddIcon />
                                    <LreTile character={character} settings={viewPreferences} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button disabled={!isValid()} onClick={saveChanges}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};
