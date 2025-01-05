import { groupBy } from 'lodash';
import React, { useContext } from 'react';
import { Box, Grid, Input, Slider } from '@mui/material';

import Typography from '@mui/material/Typography';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import { campaignsNames } from '../models/constants';
import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { ICharacter2 } from 'src/models/interfaces';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharactersFilterBy } from 'src/v2/features/characters/enums/characters-filter-by';

export const CampaignsProgress = () => {
    const { campaignsProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const allCampaigns = campaignsNames;
    const campaigns = ['Indomitus', 'Fall of Cadia', 'Octarius', 'Saim-Hann'];
    const getCampaignsProgress = (group: string) => {
        return (
            <div key={group}>
                {allCampaigns
                    .filter(x => x.includes(group))
                    .map(campaign => (
                        <CampaignProgress
                            key={campaign}
                            campaign={campaign}
                            max={campaign.includes('Elite') ? 40 : 75}
                            value={campaignsProgress[campaign]}
                            setValue={value =>
                                dispatch.campaignsProgress({
                                    type: 'Update',
                                    campaign,
                                    progress: value,
                                })
                            }
                        />
                    ))}
            </div>
        );
    };

    return (
        <div style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {campaigns.map(x => getCampaignsProgress(x))}
        </div>
    );
};

export const CampaignProgress = ({
    campaign,
    max,
    value,
    setValue,
}: {
    campaign: string;
    max: 40 | 75;
    value: number;
    setValue: (value: number) => void;
}) => {
    const { characters } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setValue(newValue as number);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value === '' ? 0 : Number(event.target.value));
    };

    const handleBlur = () => {
        if (value < 0) {
            setValue(0);
        } else if (value > max) {
            setValue(max);
        }
    };

    const requiredFaction: Map<string, string> = new Map([
        ['Indomitus', 'Ultramarines'],
        ['Indomitus Mirror', 'Necrons'],
        ['Fall of Cadia', 'Black Legion'],
        ['Fall of Cadia Mirror', 'Astra Militarum'],
        ['Octarius', 'Orks'],
        ['Octarius Mirror', 'Black Templars'],
        ['Saim-Hann', 'Aeldari'],
        ['Saim-Hann Mirror', 'Thousand Sons'],
    ]);
    const alliances: Map<string, string> = new Map([
        ['Indomitus', 'Imperial'],
        ['Indomitus Mirror', 'Necrons'],
        ['Fall of Cadia', 'Chaos'],
        ['Fall of Cadia Mirror', 'Imperial'],
        ['Octarius', 'Orks'],
        ['Octarius Mirror', 'Imperial'],
        ['Saim-Hann', 'Aeldari'],
        ['Saim-Hann Mirror', 'Chaos'],
    ]);

    function getBaseCampaign(campaign: string): string {
        let base: string = campaign;
        if (base.endsWith('Elite')) {
            base = base.substring(0, base.length - 6);
        }
        return base;
    }

    function getCampaignFaction(campaign: string): string {
        const faction = requiredFaction.get(getBaseCampaign(campaign));
        return faction != null ? faction : 'Ultramarines';
    }

    function getRequiredCharacters(campaign: string): ICharacter2[] {
        let chars: ICharacter2[] = [];
        const faction: string = getCampaignFaction(getBaseCampaign(campaign));
        groupBy(CharactersService.filterUnits(characters, CharactersFilterBy.None, ''), 'faction')[faction].forEach(
            unit => {
                const character = unit as ICharacter2;
                if (character.requiredInCampaign) chars = chars.concat(character);
            }
        );
        return chars;
    }
    return (
        <Box sx={{ width: 250, opacity: value === max ? 0.5 : 1 }}>
            <Typography id="input-slider" gutterBottom>
                <CampaignImage campaign={campaign} /> {campaign}
            </Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <Slider
                        min={0}
                        max={max}
                        color={max === 40 ? 'secondary' : 'primary'}
                        value={typeof value === 'number' ? value : 0}
                        onChange={handleSliderChange}
                        aria-labelledby="input-slider"
                    />
                </Grid>
                <Grid item>
                    <Input
                        value={value}
                        size="small"
                        onChange={handleInputChange}
                        onFocus={event => event.target.select()}
                        onBlur={handleBlur}
                        inputProps={{
                            step: 1,
                            min: 0,
                            max: max,
                            type: 'number',
                            'aria-labelledby': 'input-slider',
                        }}
                    />
                </Grid>
            </Grid>
            <Grid>
                {getRequiredCharacters(campaign).map(unit => {
                    if (unit.unitType === UnitType.character) {
                        return (
                            <div key={"'char_tile_" + unit.name + "'"} style={{ float: 'left' }}>
                                <CharacterTile key={unit.name} character={unit} onCharacterClick={() => {}} />
                            </div>
                        );
                    }
                })}
            </Grid>
        </Box>
    );
};
