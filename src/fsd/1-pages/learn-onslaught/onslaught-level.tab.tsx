import { AllCommunityModule, ColDef, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

const rowData = [
    { level: 1, xpRequired: 0, rewards: '100 Gold' },
    { level: 2, xpRequired: 500, rewards: '200 Gold, Basic Sword' },
    { level: 3, xpRequired: 1500, rewards: '300 Gold, Shield' },
    { level: 4, xpRequired: 3000, rewards: '400 Gold, Health Potion' },
    { level: 5, xpRequired: 5000, rewards: '500 Gold, Magic Ring' },
];
type RowData = (typeof rowData)[number];
const colDefs = [
    { field: 'level', filter: true },
    { field: 'xpRequired', filter: true },
    { field: 'rewards', filter: true },
] satisfies ColDef<RowData>[];

export const OnslaughtLevelTab = () => {
    return (
        <div>
            <h1>🚧 Onslaught Level Information: Under Construction 🚧</h1>
            <span className="text-red-500">All data here is a placeholder</span>
            <div className="h-screen w-full">
                <AgGridReact
                    domLayout="autoHeight"
                    autoSizeStrategy={{
                        type: 'fitCellContents',
                        skipHeader: false,
                    }}
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    defaultColDef={{
                        suppressMovable: true,
                        sortable: true,
                    }}
                    rowHeight={45}
                    columnDefs={colDefs}
                    rowData={rowData}
                />
            </div>
        </div>
    );
};
