import { AllCommunityModule, ColDef, themeBalham, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import { Alliance, RarityString, Rarity } from '@/fsd/5-shared/model';
import { BadgeImage } from '@/fsd/5-shared/ui/icons';

const rarityMap = {
    [RarityString.Common]: Rarity.Common,
    [RarityString.Uncommon]: Rarity.Uncommon,
    [RarityString.Rare]: Rarity.Rare,
    [RarityString.Epic]: Rarity.Epic,
    [RarityString.Legendary]: Rarity.Legendary,
    [RarityString.Mythic]: Rarity.Mythic,
} as const;

// Greek letters in order do not follow ASCII order, so we use array indexes for sorting
const killZoneList = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'] as const;
type KillZone = (typeof killZoneList)[number];
const killZoneComparator = (a: KillZone, b: KillZone) => killZoneList.indexOf(a) - killZoneList.indexOf(b);
const rarityComparator = (a: RarityString | null, b: RarityString | null) => {
    if (a === null && b === null) return 0;
    if (a === null) return -1;
    if (b === null) return 1;
    return Rarity[a] - Rarity[b];
};

interface RowData {
    alliance: Alliance;
    killZone: KillZone;
    sector: number;
    wave1: RarityString;
    wave2: RarityString;
    wave3: RarityString;
    wave4: RarityString;
    wave5: RarityString | null; // early onslaughts have fewer waves
    wave6: RarityString | null; // early onslaughts have fewer waves
    wave7: RarityString | null; // early onslaughts have fewer waves
}

// Helper to convert number to Roman numerals for display
function romanize(num: number) {
    const lookup = {
        M: 1000,
        CM: 900,
        D: 500,
        CD: 400,
        C: 100,
        XC: 90,
        L: 50,
        XL: 40,
        X: 10,
        IX: 9,
        V: 5,
        IV: 4,
        I: 1,
    };
    let roman = '';
    for (const i in lookup) {
        while (num >= lookup[i as keyof typeof lookup]) {
            roman += i;
            num -= lookup[i as keyof typeof lookup];
        }
    }
    return roman;
}

const rowData = [
    {
        alliance: Alliance.Imperial,
        sector: 1,
        killZone: 'Alpha',
        wave1: RarityString.Common,
        wave2: RarityString.Common,
        wave3: RarityString.Common,
        wave4: RarityString.Uncommon,
        wave5: null,
        wave6: null,
        wave7: null,
    },
    {
        alliance: Alliance.Imperial,
        sector: 1,
        killZone: 'Beta',
        wave1: RarityString.Common,
        wave2: RarityString.Common,
        wave3: RarityString.Common,
        wave4: RarityString.Common,
        wave5: RarityString.Uncommon,
        wave6: null,
        wave7: null,
    },
    {
        alliance: Alliance.Imperial,
        sector: 1,
        killZone: 'Gamma',
        wave1: RarityString.Common,
        wave2: RarityString.Common,
        wave3: RarityString.Common,
        wave4: RarityString.Common,
        wave5: RarityString.Common,
        wave6: RarityString.Uncommon,
        wave7: null,
    },
    {
        alliance: Alliance.Imperial,
        sector: 2,
        killZone: 'Gamma',
        wave1: RarityString.Common,
        wave2: RarityString.Common,
        wave3: RarityString.Common,
        wave4: RarityString.Common,
        wave5: RarityString.Common,
        wave6: RarityString.Uncommon,
        wave7: null,
    },
] as const satisfies RowData[];

const badgeCellRenderer = (row: ValueFormatterParams<RowData, RarityString | null>) => {
    if (!row.data) return '???';
    if (!row.value) return '—';
    return <BadgeImage alliance={row.data.alliance} rarity={rarityMap[row.value]} />;
};

const rowBadgeTotal = (row: ValueGetterParams<RowData>) => {
    if (!row.data) throw new Error('No data in row for badge total calculation');
    const rewardBadges = [
        row.data.wave1,
        row.data.wave2,
        row.data.wave3,
        row.data.wave4,
        row.data.wave5,
        row.data.wave6,
        row.data.wave7,
    ];
    // ToDo: clean this up once the Rarity is in a format that it is easier to iterate over
    // Uses the Rarity enum on the left to appease `BadgeImage` which requires that type
    return [
        [Rarity.Common, rewardBadges.filter(r => r === RarityString.Common).length],
        [Rarity.Uncommon, rewardBadges.filter(r => r === RarityString.Uncommon).length],
        [Rarity.Rare, rewardBadges.filter(r => r === RarityString.Rare).length],
        [Rarity.Epic, rewardBadges.filter(r => r === RarityString.Epic).length],
        [Rarity.Legendary, rewardBadges.filter(r => r === RarityString.Legendary).length],
        [Rarity.Mythic, rewardBadges.filter(r => r === RarityString.Mythic).length],
    ];
};

const badgeTotalComparator = (a: ReturnType<typeof rowBadgeTotal>, b: ReturnType<typeof rowBadgeTotal>) => {
    const rarestFirstA = a.toReversed();
    const rarestFirstB = b.toReversed();
    for (let i = 0; i < rarestFirstA.length; i++) {
        const countA = rarestFirstA[i][1];
        const countB = rarestFirstB[i][1];
        if (countA !== countB) return countA - countB;
    }
    return 0;
};

const badgeTotalRenderer = (row: ValueFormatterParams<RowData, ReturnType<typeof rowBadgeTotal>>) => {
    const { data, value } = row;
    if (!data || !value) return '???';
    return (
        <div className="flex gap-1">
            {value.map(([rarity, count]) =>
                count > 0 ? (
                    <span key={rarity}>
                        <span className="text-lg">{count}</span>
                        <BadgeImage key={rarity} alliance={data.alliance} rarity={rarity} />
                    </span>
                ) : null
            )}
        </div>
    );
};

const colDefs = [
    { field: 'alliance' },
    { field: 'sector', valueFormatter: row => romanize(row.value) },
    { field: 'killZone', comparator: killZoneComparator },
    {
        valueGetter: rowBadgeTotal,
        headerName: 'Total',
        cellRenderer: badgeTotalRenderer,
        comparator: badgeTotalComparator,
    },
    {
        field: 'wave1',
        headerName: 'Wave I',
        cellRenderer: badgeCellRenderer,
    },
    {
        field: 'wave2',
        headerName: 'Wave II',
        cellRenderer: badgeCellRenderer,
        comparator: rarityComparator,
    },
    {
        field: 'wave3',
        headerName: 'Wave III',
        cellRenderer: badgeCellRenderer,
        comparator: rarityComparator,
    },
    {
        field: 'wave4',
        headerName: 'Wave IV',
        cellRenderer: badgeCellRenderer,
        comparator: rarityComparator,
    },
    {
        field: 'wave5',
        headerName: 'Wave V',
        cellRenderer: badgeCellRenderer,
        comparator: rarityComparator,
    },
    {
        field: 'wave6',
        headerName: 'Wave VI',
        cellRenderer: badgeCellRenderer,
        comparator: rarityComparator,
    },
    {
        field: 'wave7',
        headerName: 'Wave VII',
        cellRenderer: badgeCellRenderer,
        comparator: rarityComparator,
    },
] satisfies ColDef<RowData>[];

export const OnslaughtSectorTab = () => {
    return (
        <div>
            <h1>🚧 Onslaught Sector Information: Under Construction 🚧</h1>
            <span className="text-red-500">All data here is a placeholder</span>
            <div className="h-screen w-full">
                <AgGridReact<RowData>
                    domLayout="autoHeight"
                    autoSizeStrategy={{
                        type: 'fitCellContents',
                        skipHeader: false,
                    }}
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    defaultColDef={{
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
