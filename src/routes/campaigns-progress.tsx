import React, { useContext } from 'react';
import { Box, Grid, Input, Slider } from '@mui/material';
import Typography from '@mui/material/Typography';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import { CampaignImage } from '../shared-components/campaign-image';
import { campaignsNames } from '../models/constants';

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

    return (
        <Box sx={{ width: 250 }}>
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
        </Box>
    );
};
