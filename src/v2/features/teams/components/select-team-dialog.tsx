import React, { useContext, useMemo, useState } from 'react';

import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { ICharacter2 } from 'src/models/interfaces';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { Rarity } from 'src/models/enums';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { IMow, IUnit } from 'src/v2/features/characters/characters.models';
import { TeamView } from 'src/v2/features/teams/components/team-view';
import { isCharacter, isMow } from 'src/v2/features/characters/units.functions';

type Props = {
    units: IUnit[];
    team: ICharacter2[];
    activeMow: IMow | null;
    rarityCap: Rarity;
    onClose: (team: ICharacter2[], mow: IMow | null) => void;
};

export const SelectTeamDialog: React.FC<Props> = ({ onClose, team, units, activeMow, rarityCap }) => {
    const [lineup, setLineup] = useState(team);
    const [mow, setMow] = useState(activeMow);

    const cancel = () => onClose(team, activeMow);
    const select = () => onClose(lineup, mow);

    const handleCharacterSelect = (unit: IUnit) => {
        setLineup(curr => {
            if (curr.some(x => x.name === unit.name)) {
                return curr.filter(x => x.name !== unit.name);
            } else {
                if (lineup.length === 5) {
                    return curr;
                }

                const newChar = units.find(x => x.name === unit.id);

                if (newChar && isCharacter(newChar)) {
                    return [...curr, newChar];
                }

                return curr;
            }
        });

        if (isMow(unit)) {
            if (mow && mow.id) {
                if (mow.id !== unit.id) {
                    setMow(unit);
                } else {
                    setMow(null);
                }
            } else {
                setMow(unit);
            }
        }
    };

    return (
        <Dialog open={true} onClose={cancel} fullWidth>
            <DialogTitle>
                Select team
                <TeamView characters={lineup} mow={mow} onClick={handleCharacterSelect} withMow />
            </DialogTitle>
            <DialogContent>
                <CharactersGrid
                    characters={units.map(x =>
                        isCharacter(x)
                            ? CharactersService.capCharacterAtRarity(x, rarityCap)
                            : CharactersService.capMowAtRarity(x, rarityCap)
                    )}
                    onAvailableCharacterClick={handleCharacterSelect}
                    onLockedCharacterClick={handleCharacterSelect}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={cancel}>Cancel</Button>
                <Button onClick={select}>Select</Button>
            </DialogActions>
        </Dialog>
    );
};
