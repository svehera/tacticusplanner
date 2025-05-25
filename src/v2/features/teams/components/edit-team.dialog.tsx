import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';

import { ICharacter2 } from 'src/models/interfaces';
import { getEnumValues } from 'src/shared-logic/functions';

import { Rarity } from '@/fsd/5-shared/model';
import { RaritySelect } from '@/fsd/5-shared/ui';
import { MultipleSelect } from '@/fsd/5-shared/ui/input/multiple-select';

import { IMow } from 'src/v2/features/characters/characters.models';
import { SelectTeamDialog } from 'src/v2/features/teams/components/select-team-dialog';
import { TeamView } from 'src/v2/features/teams/components/team-view';
import { guildRaidBosses, guildRaidPrimes, gwSubModes, taSubModes } from 'src/v2/features/teams/teams.constants';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { IPersonalTeam, PersonalTeam } from 'src/v2/features/teams/teams.models';

interface Props {
    onClose: () => void;
    saveTeam: (team: IPersonalTeam) => void;
    team: IPersonalTeam;
    characters: ICharacter2[];
    mows: IMow[];
}

export const EditTeamDialog: React.FC<Props> = ({ onClose, characters, mows, team, saveTeam }) => {
    const [selectedSubModes, setSelectedSubModes] = useState<string[]>(team.subModes);
    const [notes, setNotes] = useState<string>(team.notes);
    const [teamName, setTeamName] = useState<string>(team.name);
    const [rarityCap, setRarityCap] = useState(team.rarityCap);
    const [lineup, setLineup] = useState<ICharacter2[]>(team.lineup.map(id => characters.find(x => x.id === id)!));
    const [mow, setMow] = useState<IMow | null>(team.mowId ? mows.find(x => x.id === team.mowId)! : null);

    const [isOpenSelectDialog, setIsOpenSelectDialog] = useState<boolean>(false);

    const openSelectDialog = () => setIsOpenSelectDialog(true);
    const closeSelectDialog = (selectedTeam: ICharacter2[], mow: IMow | null) => {
        setLineup(selectedTeam);
        setMow(mow);
        setIsOpenSelectDialog(false);
    };

    const updateSelectedGuildBosses = (values: string[]) => {
        const nonGuildBossValues = selectedSubModes.filter(
            mod => !guildRaidBosses.some(option => option.value === mod)
        );

        setSelectedSubModes([...nonGuildBossValues, ...values]);
    };

    const updateSelectedGuildPrimes = (values: string[]) => {
        const nonGuildPrimeValues = selectedSubModes.filter(
            mod => !guildRaidPrimes.some(option => option.value === mod)
        );

        setSelectedSubModes([...nonGuildPrimeValues, ...values]);
    };

    const handleSave = () => {
        const updatedTeam = new PersonalTeam(
            team.primaryGameMode,
            selectedSubModes,
            teamName,
            notes,
            rarityCap,
            lineup.map(x => x.id),
            mow?.id
        );
        updatedTeam.id = team.id;
        saveTeam(updatedTeam);
        onClose();
    };

    const grPrimes = [...guildRaidPrimes];
    const grBosses = [...guildRaidBosses];

    for (const guildRaidPrime of grPrimes) {
        guildRaidPrime.selected = selectedSubModes.includes(guildRaidPrime.value);
    }

    for (const guildRaidBoss of grBosses) {
        guildRaidBoss.selected = selectedSubModes.includes(guildRaidBoss.value);
    }

    return (
        <Dialog open={true} onClose={onClose} fullWidth fullScreen={isMobile}>
            <DialogTitle>Edit team</DialogTitle>
            <DialogContent style={{ paddingTop: 10 }}>
                <>
                    {team.primaryGameMode === GameMode.guildRaids && (
                        <>
                            <MultipleSelect
                                label="Guild Raid Bosses"
                                options={guildRaidBosses}
                                optionsChange={updateSelectedGuildBosses}
                            />

                            <br />
                            <br />

                            <MultipleSelect
                                label="Guild Raid Primes"
                                options={guildRaidPrimes}
                                optionsChange={updateSelectedGuildPrimes}
                            />
                        </>
                    )}

                    {team.primaryGameMode === GameMode.tournamentArena && (
                        <MultipleSelect label="TA mode" options={taSubModes} optionsChange={setSelectedSubModes} />
                    )}

                    {team.primaryGameMode === GameMode.guildWar && (
                        <MultipleSelect label="GW mode" options={gwSubModes} optionsChange={setSelectedSubModes} />
                    )}
                </>

                <br />
                <br />

                <TextField
                    fullWidth
                    label="Team name"
                    variant="outlined"
                    helperText="Max length 50 characters."
                    value={teamName}
                    onChange={event => setTeamName(event.target.value.slice(0, 50))}
                />

                <br />
                <br />

                <TextField
                    fullWidth
                    id="outlined-textarea"
                    label="Notes"
                    placeholder="Notes"
                    multiline
                    maxRows={5}
                    value={notes}
                    helperText="Optional. Max length 300 characters."
                    onChange={event => setNotes(event.target.value.slice(0, 300))}
                />

                <br />
                <br />

                {(team.primaryGameMode === GameMode.tournamentArena || team.primaryGameMode === GameMode.guildWar) && (
                    <>
                        <RaritySelect
                            label={'Rarity Cap'}
                            rarityValues={getEnumValues(Rarity)}
                            value={rarityCap}
                            valueChanges={setRarityCap}
                        />

                        <br />
                        <br />
                    </>
                )}

                <TeamView
                    characters={lineup}
                    mow={mow}
                    withMow
                    onClick={() => openSelectDialog()}
                    onEmptyClick={() => openSelectDialog()}
                />

                {isOpenSelectDialog && (
                    <SelectTeamDialog
                        units={[...characters, ...mows]}
                        team={lineup}
                        activeMow={mow}
                        rarityCap={rarityCap}
                        onClose={closeSelectDialog}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
