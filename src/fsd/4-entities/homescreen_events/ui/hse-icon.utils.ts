const gameModeIconUrls = import.meta.glob<string>(
    '../../../../assets/images/snowprint_assets/misc/ui_gamemodeicon_*.png',
    {
        eager: true,
        import: 'default',
        query: '?url',
    }
);

const gameModeIconUrlByFile = new Map(
    Object.entries(gameModeIconUrls).map(([path, url]) => [path.split('/').pop() ?? path, url])
);

/** Resolves a datamined `gameModeIcon` file name to a bundled image URL, if we ship that file. */
export function getHseGameModeIconUrl(gameModeIcon: string | undefined): string | undefined {
    return gameModeIcon ? gameModeIconUrlByFile.get(gameModeIcon) : undefined;
}
