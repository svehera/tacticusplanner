import { AccessibleTooltip } from '@/fsd/5-shared/ui';

interface Props {
    warOffense: boolean;
    warDefense: boolean;
    warEnabled: boolean;
    warDisabledMessage?: string;
    guildRaid: boolean;
    tournamentArena: boolean;
    tournamentArenaEnabled?: boolean;
    tournamentArenaDisabledMessage?: string;
    battleFieldLevels: boolean[];
    teamName: string;
    isOpen: boolean;
    saveAllowed: boolean;
    saveDisallowedMessage?: string;
    onWarOffenseChanged: (offense: boolean) => void;
    onWarDefenseChanged: (defense: boolean) => void;
    onGuildRaidChanged: (guildRaid: boolean) => void;
    onTournamentArenaChanged: (tournamentArena: boolean) => void;
    onBattleFieldLevelsChanged: (levels: boolean[]) => void;
    onTeamNameChange: (teamName: string) => void;
    onCancel: () => void;
    onSave: () => void;
}
export const SaveTeamDialog: React.FC<Props> = ({
    warOffense,
    warDefense,
    warEnabled,
    warDisabledMessage,
    guildRaid,
    tournamentArena,
    tournamentArenaEnabled,
    tournamentArenaDisabledMessage,
    battleFieldLevels,
    teamName,
    saveAllowed,
    saveDisallowedMessage,
    isOpen,
    onWarOffenseChanged,
    onWarDefenseChanged,
    onGuildRaidChanged,
    onTournamentArenaChanged,
    onBattleFieldLevelsChanged,
    onTeamNameChange,
    onCancel,
    onSave,
}: Props) => {
    if (!isOpen) return null;

    const handleBattleFieldLevelChange = (level: number) => {
        const newLevels = [...battleFieldLevels];
        newLevels[level - 1] = !newLevels[level - 1];
        onBattleFieldLevelsChanged(newLevels);
    };

    const handleSave = () => {
        onSave();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-opacity">
            <div className="scrollbar-hide relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#1a2234]">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-[#1e293b]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Save Team</h2>
                    <button
                        onClick={onCancel}
                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    <div>
                        <div className="mb-2 flex items-end justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                            {!saveAllowed && (
                                <span className="text-xs text-red-500 italic">{saveDisallowedMessage}</span>
                            )}
                        </div>
                        <input
                            type="text"
                            value={teamName}
                            onChange={e => onTeamNameChange(e.target.value)}
                            placeholder="Enter team name..."
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 transition-all outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-[#0f172a] dark:text-white"
                        />
                    </div>

                    <div className="flex gap-6">
                        <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                            <AccessibleTooltip title={warEnabled ? '' : warDisabledMessage!}>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={warEnabled && warOffense}
                                        disabled={!warEnabled}
                                        onChange={() => onWarOffenseChanged(!warOffense)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    War Offense
                                </div>
                            </AccessibleTooltip>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                            <AccessibleTooltip title={warEnabled ? '' : warDisabledMessage!}>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={warEnabled && warDefense}
                                        disabled={!warEnabled}
                                        onChange={() => onWarDefenseChanged(!warDefense)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    War Defense
                                </div>
                            </AccessibleTooltip>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={guildRaid}
                                onChange={() => onGuildRaidChanged(!guildRaid)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Guild Raid
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-gray-700 dark:text-gray-300">
                            <AccessibleTooltip title={tournamentArenaEnabled ? '' : tournamentArenaDisabledMessage!}>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={tournamentArenaEnabled && tournamentArena}
                                        disabled={!tournamentArenaEnabled}
                                        onChange={() => onTournamentArenaChanged(!tournamentArena)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Tournament Arena
                                </div>
                            </AccessibleTooltip>
                        </label>
                    </div>

                    <div>
                        <h4 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                            Battlefield Levels
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map(lvl => (
                                <label
                                    key={lvl}
                                    className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 transition-colors ${
                                        battleFieldLevels[lvl - 1]
                                            ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                            : 'border-gray-200 text-gray-500 dark:border-slate-700'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        hidden
                                        checked={battleFieldLevels[lvl - 1]}
                                        onChange={() => handleBattleFieldLevelChange(lvl)}
                                    />
                                    <span className="text-sm font-medium">Lvl {lvl}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-[#1e293b]">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!saveAllowed}
                        className={`rounded-lg px-6 py-2 text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 ${
                            saveAllowed
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'cursor-not-allowed bg-gray-400 text-gray-200'
                        }`}>
                        Save Team
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 -z-10" onClick={onCancel}></div>
        </div>
    );
};
