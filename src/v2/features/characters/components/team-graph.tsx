import React from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { isMobile } from 'react-device-detect';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';

import { ResponsiveLine } from '@nivo/line';
import { InfoTeamGraphBox } from './info-team-graph-box';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { IUnit } from 'src/v2/features/characters/characters.models';

interface Props {
    units: IUnit[];
}

export const TeamGraph: React.FC<Props> = ({ units }) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    // For the power graph
    const teamPowerData: { x: string; y: number }[] = [];
    const teamAttributeData: { x: string; y: number }[] = [];
    const teamAbilityData: { x: string; y: number }[] = [];
    units.forEach(character => {
        const power = CharactersPowerService.getCharacterPower(character);
        const attributePower = CharactersPowerService.getCharacterAttributePower(character);
        const abilityPower = CharactersPowerService.getCharacterAbilityPower(character);

        teamPowerData.push({ x: character.name, y: power });
        teamAttributeData.push({ x: character.name, y: attributePower });
        teamAbilityData.push({ x: character.name, y: abilityPower });
    });

    const sortByPower = (a: { x: string; y: number }, b: { x: string; y: number }) => b.y - a.y;
    teamPowerData.sort(sortByPower);
    teamAttributeData.sort((a, b) => {
        const aIndex = teamPowerData.findIndex(item => item.x === a.x);
        const bIndex = teamPowerData.findIndex(item => item.x === b.x);
        return sortByPower(teamPowerData[aIndex], teamPowerData[bIndex]);
    });
    teamAbilityData.sort((a, b) => {
        const aIndex = teamPowerData.findIndex(item => item.x === a.x);
        const bIndex = teamPowerData.findIndex(item => item.x === b.x);
        return sortByPower(teamPowerData[aIndex], teamPowerData[bIndex]);
    });

    const data = [
        { id: 'Attribute', data: teamAttributeData },
        { id: 'Power', data: teamPowerData },
    ];

    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <BarChartIcon style={{ cursor: 'pointer' }} color="primary" />
            </IconButton>
            <Dialog open={open} onClose={handleClose} maxWidth={isMobile ? 'xl' : 'lg'} fullWidth>
                <DialogTitle>
                    Roster Power Distribution <InfoTeamGraphBox />
                </DialogTitle>
                <DialogContent>
                    <div style={{ height: '380px' }}>
                        <ResponsiveLine
                            data={data}
                            enablePoints={false}
                            enableArea={true}
                            colors={{ scheme: 'spectral' }}
                            lineWidth={1}
                            curve="stepAfter"
                            margin={{
                                top: 10,
                                right: 0,
                                bottom: 10,
                                left: 40,
                            }}
                            enableGridX={false}
                            axisBottom={null}
                            enableGridY={true}
                            yScale={{
                                type: 'linear',
                                reverse: false,
                                min: -2500,
                                max: 40000,
                            }}
                            gridYValues={[851, 2212, 5097, 11194, 23758, 40000]}
                            useMesh={true}
                            animate={false}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>OK</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
