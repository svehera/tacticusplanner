import React from 'react';
import { ResponsiveLine } from '@nivo/line';

export const TeamGraph: React.FC<{ data: { id: string; data: { x: string; y: number }[] }[] }> = ({ data }) => {
    return (
        <div style={{ height: '400px' }}>
            <ResponsiveLine
                data={data}
                enableArea={true}
                lineWidth={3}
                curve="stepAfter"
                margin={{ top: 10, right: 0, bottom: 10, left: 100 }}
                yScale={{ type: 'linear', min: 0, max: 40000 }}
                axisBottom={null}
                axisLeft={{
                    legend: 'power',
                    legendOffset: -60,
                    legendPosition: 'middle',
                }}
                enableGridX={false}
                enablePoints={false}
                colors="#000000"
                pointSize={0}
                useMesh={true}
            />
        </div>
    );
};
