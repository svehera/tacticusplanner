const questMapUrls = import.meta.glob<string>('../../../assets/images/snowprint_assets/quest_maps/*.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
});

const urlByBoardId = new Map(
    Object.entries(questMapUrls).map(([filePath, url]) => [
        filePath
            .split('/')
            .pop()!
            .replace(/\.jpg$/, ''),
        url,
    ])
);

/** @returns the URL of the board (map) image for a quest battle's `boardId`, if we have one. */
export const getQuestMapUrl = (boardId: string): string | undefined => urlByBoardId.get(boardId);
