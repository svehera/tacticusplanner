import { AllCommunityModule, ColDef, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState, useEffect } from 'react';

import {
    TacticusGuildRole,
    TacticusGuild,
    getTacticusGuildData,
    TacticusGuildMember,
    // eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
} from '@/fsd/5-shared/lib/tacticus-api';

// Helper function to convert role enum to readable string
const getRoleLabel = (role: TacticusGuildRole): string => {
    switch (role) {
        case TacticusGuildRole.LEADER:
            return 'Leader';
        case TacticusGuildRole.CO_LEADER:
            return 'Co-Leader';
        case TacticusGuildRole.OFFICER:
            return 'Officer';
        case TacticusGuildRole.MEMBER:
            return 'Member';
        default:
            return 'Unknown';
    }
};

// Component to format the date
const DateFormatter: React.FC<{ value: string | null | undefined }> = ({ value }) => {
    if (!value) return <span>Never</span>;

    const date = new Date(value);
    const formattedDate = date.toLocaleDateString();
    const daysAgo = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));

    return (
        <span>
            {formattedDate} ({daysAgo} days ago)
        </span>
    );
};

// Component for rendering role with color coding
const RoleRenderer: React.FC<{ value: TacticusGuildRole }> = ({ value }) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';

    switch (value) {
        case TacticusGuildRole.LEADER:
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            break;
        case TacticusGuildRole.CO_LEADER:
            bgColor = 'bg-orange-100';
            textColor = 'text-orange-800';
            break;
        case TacticusGuildRole.OFFICER:
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
            break;
        case TacticusGuildRole.MEMBER:
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            break;
    }

    return (
        <span className={`px-2 py-1 rounded ${bgColor} ${textColor} text-xs font-medium`}>{getRoleLabel(value)}</span>
    );
};

export const TacticusGuildVisualization: React.FC<{ userIdMapper: (userId: string) => string }> = ({
    userIdMapper,
}) => {
    const [guildData, setGuildData] = useState<TacticusGuild | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTacticusGuildData()
            .then(response => {
                setGuildData(response.data?.guild ?? null);
                setLoading(false);
            })
            .catch(error => {
                setError(error);
            });
    }, []);

    // AG Grid column definitions
    const columnDefs: ColDef<TacticusGuildMember>[] = [
        {
            field: 'userId',
            headerName: 'User Nickname',
            valueGetter: col => userIdMapper(col.data?.userId ?? '000'),
            sortable: true,
        },
        {
            headerName: 'User ID',
            field: 'userId',
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: 'Role',
            field: 'role',
            sortable: true,
            filter: true,
            cellRenderer: RoleRenderer,
            flex: 1,
        },
        {
            headerName: 'Level',
            field: 'level',
            sortable: true,
            filter: true,
            flex: 1,
        },
        {
            headerName: 'Last Activity',
            field: 'lastActivityOn',
            sortable: true,
            filter: true,
            cellRenderer: DateFormatter,
            flex: 2,
        },
    ];

    // Stats calculation
    const calculateStats = () => {
        if (!guildData) return null;

        const totalMembers = guildData.members.length;
        const avgLevel = guildData.members.reduce((sum, member) => sum + member.level, 0) / totalMembers;

        const roleCount = {
            [TacticusGuildRole.LEADER]: 0,
            [TacticusGuildRole.CO_LEADER]: 0,
            [TacticusGuildRole.OFFICER]: 0,
            [TacticusGuildRole.MEMBER]: 0,
        };

        guildData.members.forEach(member => {
            roleCount[member.role]++;
        });

        // Calculate active members (active in last 7 days)
        const activeMembers = guildData.members.filter(member => {
            if (!member.lastActivityOn) return false;
            const lastActivity = new Date(member.lastActivityOn);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 3600 * 24));
            return diffDays <= 7;
        }).length;

        return { totalMembers, avgLevel, roleCount, activeMembers };
    };

    const stats = calculateStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-fg">Loading guild data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-danger/20 border border-danger/70 text-danger-fg px-4 py-3 rounded">
                <p>{error}</p>
            </div>
        );
    }

    if (!guildData) {
        return (
            <div className="bg-warning/20 border border-warning/70 text-warning-fg px-4 py-3 rounded">
                <p>No guild data available.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Guild Header */}
            <div className="bg-primary rounded-lg shadow-lg p-6 mb-6 text-primary-fg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{guildData.name}</h1>
                        <div className="flex items-center mt-2">
                            <span className="bg-secondary/80 text-secondary-fg px-2 py-1 rounded text-sm mr-3">
                                {guildData.guildTag}
                            </span>
                            <span className="text-sm">ID: {guildData.guildId}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold">{guildData.level}</div>
                        <div className="text-sm uppercase tracking-wide">Guild Level</div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Total Members</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">{stats.totalMembers}</div>
                    </div>
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Average Level</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">{stats.avgLevel.toFixed(1)}</div>
                    </div>
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Active Members</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">
                            {stats.activeMembers}
                            <span className="text-sm font-normal text-muted-fg ml-1">
                                ({Math.round((stats.activeMembers / stats.totalMembers) * 100)}%)
                            </span>
                        </div>
                    </div>
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Raid Seasons</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">
                            {guildData.guildRaidSeasons.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Raid Seasons */}
            <div className="bg-overlay rounded-lg shadow mb-6 p-4">
                <h2 className="text-lg font-semibold mb-3 text-overlay-fg">Raid Seasons</h2>
                <div className="flex flex-wrap gap-2">
                    {guildData.guildRaidSeasons.map(season => (
                        <span key={season} className="bg-accent/20 text-accent-fg px-3 py-1 rounded-full text-sm">
                            Season {season}
                        </span>
                    ))}
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-overlay rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-3 text-overlay-fg">Guild Members</h2>
                <div className="w-full h-96">
                    <AgGridReact
                        modules={[AllCommunityModule]}
                        theme={themeBalham}
                        rowData={guildData.members}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            resizable: true,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
