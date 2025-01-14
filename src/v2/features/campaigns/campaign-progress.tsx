import React, { useMemo, useState } from 'react';
import { Box, Grid, Input, Slider } from '@mui/material';
import Typography from '@mui/material/Typography';
import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { ICampaignModel } from './campaigns.models';
import { CampaignDifficulty } from './campaigns.enums';
import { ICharacter2 } from 'src/models/interfaces';
import { useDebounceCallback } from 'usehooks-ts';

interface Props {
    characters: ICharacter2[];
    campaign: ICampaignModel;
    progress: number;
    changeProgress: (value: number) => void;
}

export const CampaignProgress: React.FC<Props> = ({
    campaign,
    progress: initialProgress,
    changeProgress,
    characters,
}) => {
    const [currProgress, setCurrProgress] = useState(initialProgress);
    const debounceProgressChange = useDebounceCallback(changeProgress, 500);

    const getMaxNodes = (difficulty: CampaignDifficulty) => {
        switch (difficulty) {
            case CampaignDifficulty.standard:
            case CampaignDifficulty.mirror:
                return 75;
            case CampaignDifficulty.elite:
                return 40;
            case CampaignDifficulty.eventStandard:
            case CampaignDifficulty.eventExtremis:
                return 30;
            case CampaignDifficulty.eventChallenge:
                return 3;
            default:
                return 0;
        }
    };

    const getColor = (difficulty: CampaignDifficulty) => {
        switch (difficulty) {
            case CampaignDifficulty.elite:
            case CampaignDifficulty.eventExtremis:
                return 'secondary';
            default:
                return 'primary';
        }
    };

    const max = useMemo(() => getMaxNodes(campaign.difficulty), [campaign.difficulty]);
    const color = useMemo(() => getColor(campaign.difficulty), [campaign.difficulty]);
    const requiredCharacters = useMemo(
        () => characters.filter(x => x.faction === campaign.faction && x.requiredInCampaign),
        []
    );

    const updateProgress = (value: number): void => {
        setCurrProgress(value);
        debounceProgressChange(value);
    };

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        updateProgress(newValue as number);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        updateProgress(event.target.value === '' ? 0 : Number(event.target.value));
    };

    const handleBlur = () => {
        if (currProgress < 0) {
            updateProgress(0);
        } else if (currProgress > max) {
            updateProgress(max);
        }
    };

    return (
        <Box sx={{ width: 250, opacity: currProgress === max ? 0.5 : 1 }}>
            <Typography id="input-slider" gutterBottom>
                <CampaignImage campaign={campaign.id} /> <span>{campaign.name}</span>
            </Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <Slider
                        min={0}
                        max={max}
                        color={color}
                        value={currProgress}
                        onChange={handleSliderChange}
                        aria-labelledby="input-slider"
                    />
                </Grid>
                <Grid item>
                    <Input
                        value={currProgress}
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
                <div className="flex-box gap5">
                    {requiredCharacters.map(unit => (
                        <CharacterTile key={unit.id} character={unit} />
                    ))}
                </div>
            </Grid>
        </Box>
    );
};
