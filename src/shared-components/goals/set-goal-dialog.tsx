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
import { IPersonalGoal } from '../../models/interfaces';
import { v4 } from 'uuid';
import { PersonalGoalType, Rank, Rarity } from '../../models/enums';
import { useCharacters } from '../../services';
import InputLabel from '@mui/material/InputLabel';

export const SetGoalDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: (goal?: IPersonalGoal) => void }) => {
    const { characters } = useCharacters();
    const [form, setForm] = useState<IPersonalGoal>(() =>({
        id: v4(),
        character: '',
        type: PersonalGoalType.UpgradeRank,
        targetRarity: Rarity.Uncommon,
        targetRank: Rank.Stone1
    }));
    
    const charactersNames = useMemo(() => characters.map(x => x.name).sort(), [characters.length]);
    
    
    const targetRaritySelector = (
        <FormControl style={{ marginTop: 20 }} fullWidth >
            <InputLabel id="target-rarity-label">Target Rarity</InputLabel>
            <Select<Rarity>
                id="target-rarity"
                labelId="target-rarity-label"
                label="Target Rarity"
                defaultValue={Rarity.Uncommon}
                onChange={event => setForm(curr => ({ ...curr, targetRarity: +event.target.value }))}
            >
                <MenuItem value={Rarity.Uncommon}>Uncommon</MenuItem>
                <MenuItem value={Rarity.Rare}>Rare</MenuItem>
                <MenuItem value={Rarity.Epic}>Epic</MenuItem>
                <MenuItem value={Rarity.Legendary}>Legendary</MenuItem>
            </Select>
        </FormControl>
    );

    const targetRankSelector = (
        <FormControl style={{ marginTop: 20 }} fullWidth >
            <InputLabel id="target-rank-label">Target Rank</InputLabel>
            <Select<Rank>
                id="target-rank"
                labelId="target-rank-label"
                label="Target Rank"
                defaultValue={Rank.Stone1}
                onChange={event => setForm(curr => ({ ...curr, targetRank: +event.target.value }))}
            >
                <MenuItem value={Rank.Stone1}>Stone I</MenuItem>
                <MenuItem value={Rank.Stone2}>Stone II</MenuItem>
                <MenuItem value={Rank.Stone3}>Stone III</MenuItem>
                
                <MenuItem value={Rank.Iron1}>Iron I</MenuItem>
                <MenuItem value={Rank.Iron2}>Iron II</MenuItem>
                <MenuItem value={Rank.Iron3}>Iron III</MenuItem>

                <MenuItem value={Rank.Bronze1}>Bronze I</MenuItem>
                <MenuItem value={Rank.Bronze2}>Bronze II</MenuItem>
                <MenuItem value={Rank.Bronze3}>Bronze III</MenuItem>

                <MenuItem value={Rank.Silver1}>Silver I</MenuItem>
                <MenuItem value={Rank.Silver2}>Silver II</MenuItem>
                <MenuItem value={Rank.Silver3}>Silver III</MenuItem>

                <MenuItem value={Rank.Gold1}>Gold I</MenuItem>
                <MenuItem value={Rank.Gold2}>Gold II</MenuItem>
                <MenuItem value={Rank.Gold3}>Gold III</MenuItem>

                <MenuItem value={Rank.Diamond1}>Diamond I</MenuItem>
                <MenuItem value={Rank.Diamond2}>Diamond II</MenuItem>
                <MenuItem value={Rank.Diamond3}>Diamond III</MenuItem>
            </Select>
        </FormControl>
    );
    
    return (
        <Dialog open={isOpen} onClose={() => onClose()} fullWidth>
            <DialogTitle>Set Goal</DialogTitle>
            <DialogContent>
                <Box component="form" id="set-goal-form" style={{ padding: 20 }} onSubmit={event => event.preventDefault()}>
                    <Autocomplete
                        id="combo-box-demo"
                        options={charactersNames}
                        onChange={(_,value)  => setForm(curr => ({ ...curr, character: value ?? '' }))}
                        renderInput={(params) => <TextField {...params} label="Character" fullWidth/>}
                    />

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
                    
                    { form.type === PersonalGoalType.UpgradeRank ? targetRankSelector : undefined }
                    { form.type === PersonalGoalType.Ascend ? targetRaritySelector : undefined }
                    
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
                <Button onClick={() => onClose()}>Cancel</Button>
                <Button disabled={!form.character} form="set-goal-form" type="submit" onClick={() => onClose(form)}>Set</Button>
            </DialogActions>
        </Dialog>
    );
};