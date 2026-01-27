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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-lg bg-white dark:bg-[#1a2234] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Save Team</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
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

                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Name</label>
                            {!saveAllowed && (
                                <span className="text-red-500 text-xs italic">{saveDisallowedMessage}</span>
                            )}
                        </div>
                        <input
                            type="text"
                            value={teamName}
                            onChange={e => onTeamNameChange(e.target.value)}
                            placeholder="Enter team name..."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <AccessibleTooltip title={warEnabled ? '' : warDisabledMessage!}>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={warEnabled && warOffense}
                                        disabled={!warEnabled}
                                        onChange={() => onWarOffenseChanged(!warOffense)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    War Offense
                                </div>
                            </AccessibleTooltip>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <AccessibleTooltip title={warEnabled ? '' : warDisabledMessage!}>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={warEnabled && warDefense}
                                        disabled={!warEnabled}
                                        onChange={() => onWarDefenseChanged(!warDefense)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    War Defense
                                </div>
                            </AccessibleTooltip>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={guildRaid}
                                onChange={() => onGuildRaidChanged(!guildRaid)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Guild Raid
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <AccessibleTooltip title={tournamentArenaEnabled ? '' : tournamentArenaDisabledMessage!}>
                                <div>
                                    <input
                                        type="checkbox"
                                        checked={tournamentArenaEnabled && tournamentArena}
                                        disabled={!tournamentArenaEnabled}
                                        onChange={() => onTournamentArenaChanged(!tournamentArena)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Tournament Arena
                                </div>
                            </AccessibleTooltip>
                        </label>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Battlefield Levels
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map(lvl => (
                                <label
                                    key={lvl}
                                    className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors ${
                                        battleFieldLevels[lvl - 1]
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600'
                                            : 'border-gray-200 dark:border-slate-700 text-gray-500'
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

                <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-[#1e293b] border-t border-gray-200 dark:border-slate-700">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!saveAllowed}
                        className={`px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 ${
                            saveAllowed
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-gray-400 cursor-not-allowed text-gray-200'
                        }`}>
                        Save Team
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 -z-10" onClick={onCancel}></div>
        </div>
    );
};
