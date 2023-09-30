import React, { useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
    Autocomplete,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    MenuItem,
    Select,
    TextField
} from '@mui/material';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';
import { ICharacter, IPersonalGoal } from '../../models/interfaces';
import { v4 } from 'uuid';
import { PersonalGoalType, Rank, Rarity } from '../../models/enums';
import { useCharacters, usePersonalData } from '../../services';
import InputLabel from '@mui/material/InputLabel';
import { CharacterTitle } from '../character-title';
import { getEnumValues, rankToString } from '../../shared-logic/functions';
import { RankImage } from '../rank-image';
import { Tooltip } from '@fluentui/react-components';
import { enqueueSnackbar } from 'notistack';

const getDefaultForm = (priority: number) =>({
    id: v4(),
    character: '',
    type: PersonalGoalType.UpgradeRank,
    targetRarity: Rarity.Uncommon,
    targetRank: Rank.Stone1,
    priority,
});

export const SetGoalDialog = ({ onClose }: { onClose?: (goal?: IPersonalGoal) => void }) => {
    const goalsLimit = 20;
    const { characters } = useCharacters();
    const { personalData, updateGoals } = usePersonalData();
    
    const [openAutocomplete, setOpenAutocomplete] = React.useState(false);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [goals, setGoals] = useState<IPersonalGoal[]>(() => personalData.goals);
    const [character, setCharacter] = React.useState<ICharacter | null>(null);

    const [form, setForm] = useState<IPersonalGoal>(() => getDefaultForm(goals.length + 1));


    const disableNewGoals = useMemo(() => goals.length === goalsLimit, [goals.length]);

    const handleClose = (goal?: IPersonalGoal | undefined): void => {
        if (goal) {
            setGoals(currentGoals => {
                currentGoals.splice(goal.priority - 1, 0, goal);
                updateGoals([...currentGoals]);
                enqueueSnackbar(`Goal for ${goal.character} is added`, { variant: 'success' });
                return [...currentGoals];
            });
        }
        setOpenDialog(false);
        if(onClose) {
            onClose(goal);
        }
    };


    const rarityValues = useMemo(() => {
        const result = getEnumValues(Rarity).filter(x => x > 0 && (!character || x >= character.rarity));
        setForm(curr => ({ ...curr, targetRarity: character?.rarity ?? result[0] }));
        return result;
    }, [character]);
    
    const targetRaritySelector = (
        <FormControl style={{ marginTop: 20 }} fullWidth >
            <InputLabel id="target-rarity-label">Target Rarity</InputLabel>
            <Select<Rarity>
                id="target-rarity"
                labelId="target-rarity-label"
                label="Target Rarity"
                defaultValue={rarityValues[0]}
                value={form.targetRarity}
                onChange={event => setForm(curr => ({ ...curr, targetRarity: +event.target.value }))}
            >
                {rarityValues.map(rarity => (
                    <MenuItem key={rarity} value={rarity}>
                        {Rarity[rarity]}
                    </MenuItem>))}
            </Select>
        </FormControl>
    );

    const rankValues = useMemo(() => {
        const result = getEnumValues(Rank).filter(x => x > 0 && (!character || x >= character.rank));
        setForm(curr => ({ ...curr, targetRank: character?.rank ?? result[0] }));
        return result;
    }, [character]);
    
    const targetRankSelector = (
        <FormControl style={{ marginTop: 20 }} fullWidth >
            <InputLabel id="target-rank-label">Target Rank</InputLabel>
            <Select<Rank>
                id="target-rank"
                labelId="target-rank-label"
                label="Target Rank"
                defaultValue={rankValues[0]}
                value={form.targetRank}
                onChange={event => setForm(curr => ({ ...curr, targetRank: +event.target.value }))}
            >
                {rankValues.map(rank => (
                    <MenuItem key={rank} value={rank}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <span>{rankToString(rank)}</span>  
                            <RankImage rank={rank}/>
                        </div>
                    </MenuItem>))}
            </Select>
        </FormControl>
    );
    
    const updateValue = (value: ICharacter | null): void =>{
        if(character?.name !== value?.name) {
            setCharacter(value);
            setForm(curr => ({ ...curr, character: value?.name ?? '' }));
            setOpenAutocomplete(false);
        }
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        const key = event.key;
        if(key === 'Enter') {
            const value = (event.target as HTMLInputElement).value ?? '';
            const char = characters.find(x => x.name.toLowerCase().includes(value.toLowerCase()));
            if(char) {
                updateValue(char);
            }
        }
    };
    
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tooltip content="You can have only 20 goals at the same time" relationship={'description'} visible={disableNewGoals}>
                    <span>
                        <Button variant={'contained'} disabled={disableNewGoals} onClick={() => setOpenDialog(true)}>Set Goal</Button>
                    </span>
                </Tooltip>
            </div>

            <Dialog open={openDialog} onClose={() => handleClose()} fullWidth>
                <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 15 }}><span>Set Goal</span> { character ? <CharacterTitle character={character}/> : undefined}</DialogTitle>
                <DialogContent>
                    <Box component="form" id="set-goal-form" style={{ padding: 20 }} onSubmit={event => event.preventDefault()}>
                        <Autocomplete
                            id="combo-box-demo"
                            options={characters}
                            value={character}
                            open={openAutocomplete}
                            onFocus={() => setOpenAutocomplete(true)}
                            onBlur={() => setOpenAutocomplete(false)}
                            getOptionLabel={option => option.name}
                            isOptionEqualToValue={(option, value) => option.name === value.name}
                            renderOption={(props, option) => (<CharacterTitle {...props} key={option.name} character={option} showLockedWithOpacity={true} onClick={() => updateValue(option)}/>)}
                            onChange={(_, value) => updateValue(value)}
                            renderInput={(params) => 
                                <TextField 
                                    {...params} 
                                    fullWidth
                                    onChange={() => setOpenAutocomplete(true)} 
                                    label="Character"
                                    onKeyDown={handleKeyDown}
                                />}
                        />

                        <FormControl style={{ marginTop: 20 }} fullWidth >
                            <InputLabel id="priority-label">Priority</InputLabel>
                            <Select<number>
                                id="priority"
                                labelId="priority-label"
                                label="Priority"
                                defaultValue={goals.length + 1}
                                onChange={event => setForm(curr => ({ ...curr, priority: +event.target.value }))}
                            >
                                { Array.from({ length: goals.length + 1 }, (_, index) => index + 1).map(priority => (<MenuItem key={priority} value={priority}>{priority}</MenuItem>)) }
                            </Select>
                        </FormControl>

                        <FormControl style={{ marginTop: 20 }} fullWidth >
                            <InputLabel id="goal-type-label">Goal Type</InputLabel>
                            <Select<PersonalGoalType>
                                id="goal-type"
                                labelId="goal-type-label"
                                label="Goal Type"
                                defaultValue={PersonalGoalType.UpgradeRank}
                                onChange={event => setForm(curr => ({ ...curr, type: +event.target.value }))}
                            >
                                <MenuItem value={PersonalGoalType.UpgradeRank}>Upgrade Rank</MenuItem>
                                <MenuItem value={PersonalGoalType.Ascend}>Ascend</MenuItem>
                            </Select>
                        </FormControl>
                    
                        { character && form.type === PersonalGoalType.UpgradeRank ? targetRankSelector : undefined }
                        { character && form.type === PersonalGoalType.Ascend ? targetRaritySelector : undefined }
                        
                        <TextField
                            style={{ marginTop: 20 }}
                            fullWidth
                            id="outlined-textarea"
                            label="Notes"
                            placeholder="Notes"
                            multiline
                            helperText="Optional. Max length 200 characters."
                            onChange={event => setForm(curr => ({ ...curr, notes: event.target.value.slice(0, 200) }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleClose()}>Cancel</Button>
                    <Button disabled={!form.character} onClick={() => handleClose(form)}>Set</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};