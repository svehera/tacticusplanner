import React from 'react';
import { ResponsiveLine } from '@nivo/line';

export const TeamGraph: React.FC<{ data: { id: string; data: { x: string; y: number }[] }[] }> = ({ data }) => {
    return (
        <div style={{ height: '380px', width: '480px' }}>
            <ResponsiveLine
                data={data}
                enablePoints={false}
                enableArea={true}
                colors="#ff0000"
                lineWidth={1}
                curve="stepAfter"
                margin={{
                    top: 10,
                    right: 0,
                    bottom: 10,
                    left: 100,
                }}
                axisLeft={{
                    legend: 'power',
                    legendOffset: -60,
                    legendPosition: 'middle',
                }}
                yScale={{
                    type: 'linear',
                    min: 0,
                    max: 40000,
                    stacked: true,
                    reverse: false,
                }}
                axisBottom={null}
                enableGridX={false}
                useMesh={true}
            />
        </div>
    );
};
