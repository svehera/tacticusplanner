import React from 'react';
import { ResponsiveLine } from '@nivo/line';

export const TeamGraph: React.FC<{ data: { id: string; data: { x: string; y: number }[] }[] }> = ({ data }) => {
    return (
        <div style={{ height: '380px', width: '480px' }}>
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
                    left: 100,
                }}
                enableGridX={true}
                axisBottom={null}
                enableGridY={true}
                axisLeft={{
                    tickValues: [851, 2212, 5097, 11194, 21930, 40000],
                }}
                yScale={{
                    type: 'linear',
                    reverse: false,
                    min: 0,
                    max: 40000,
                }}
                gridYValues={[851, 2212, 5097, 11194, 21930, 40000]}
                useMesh={true}
                animate={false}
            />
        </div>
    );
};
