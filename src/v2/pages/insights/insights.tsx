import React from 'react';
import { useGetInsights } from 'src/v2/features/insights/insights.endpoint';
import Box from '@mui/material/Box';

import topFaction from 'src/v2/assets/topFaction.png';
import topCharacters from 'src/v2/assets/topChar.png';

export const Insights = () => {
    const { data, loading } = useGetInsights();
    return (
        <Box style={{ margin: 'auto' }}>
            {loading && <div>Loading...</div>}
            {data && (
                <div>
                    <p>
                        Registered users: <b>{data.registeredUsers}</b>{' '}
                    </p>
                    <p>
                        Active users last 30 days: <b>{data.activeLast30Days}</b>{' '}
                    </p>
                    <p>
                        Active users last 7 days: <b>{data.activeLast7Days}</b>{' '}
                    </p>
                    <p>
                        Data on the average user&apos;s roster is coming soon. Here are some screenshots as of January
                        12th.
                    </p>
                    <img src={topFaction} alt="By faction power" />
                    <img src={topCharacters} alt="By character's power" />
                </div>
            )}
        </Box>
    );
};
