import { Box, Grid, Input, Slider } from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useEffect, useMemo, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

import { ICampaignModel, CampaignImage, CampaignDifficulty } from '@/fsd/4-entities/campaign';
import { ICharacter2 } from '@/fsd/4-entities/character';

// eslint-disable-next-line import-x/no-internal-modules
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';

interface Props {
    characters: ICharacter2[];
    campaign: ICampaignModel;
    progress: number; // Initial progress of the campaign.
    changeProgress: (value: number) => void; // Callback to update progress externally.
}

/**
 * CampaignProgress Component
 * Displays the progress of a campaign using a slider and input,
 * and lists required characters for the campaign.
 */
export const CampaignProgress: React.FC<Props> = ({
    campaign,
    progress: initialProgress,
    changeProgress,
    characters,
}) => {
    const [currProgress, setCurrProgress] = useState(initialProgress);
    const debounceProgressChange = useDebounceCallback(changeProgress, 500);

    useEffect(() => {
        setCurrProgress(initialProgress);
    }, [initialProgress]);

    // Get the maximum number of nodes based on the campaign difficulty.
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

    //  Get the color based on the campaign difficulty.
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

    // Filter characters required for the campaign.
    const coreCharacters = useMemo(
        () => characters.filter(x => campaign.coreCharacters.includes(x.snowprintId!)),
        [characters, campaign]
    );

    const updateProgress = (value: number): void => {
        setCurrProgress(value);
        debounceProgressChange(value);
    };

    const handleSliderChange = (_event: Event, newValue: number | number[]) => {
        updateProgress(newValue as number);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        updateProgress(event.target.value === '' ? 0 : Number(event.target.value));
    };

    /**
     * Handle blur events for the input field to ensure the progress value is within bounds.
     */
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
                <CampaignImage campaign={campaign.id} />{' '}
                <span style={{ display: 'inline-block' }}>{campaign.displayName}</span>
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
                <div className="flex-box">
                    {coreCharacters.map(unit => (
                        <CharacterTile key={unit.id} character={unit} />
                    ))}
                </div>
            </Grid>
        </Box>
    );
};
