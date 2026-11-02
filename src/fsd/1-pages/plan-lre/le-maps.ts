const leMapUrls = import.meta.glob<string>('../../../assets/images/snowprint_assets/le_maps/*.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
});

const urlByName = new Map(
    Object.entries(leMapUrls).map(([filePath, url]) => [
        filePath
            .split('/')
            .pop()!
            .replace(/\.jpg$/, ''),
        url,
    ])
);

/**
 * @returns the URL of the map image for a legendary event battle's `mapId`, if we have one. Prefers
 * `legendary_event_<mapId>`, drawn with only the spawn points the legendary event battles use, over the
 * generic `<mapId>` image, which shows every spawn point set the board has.
 */
export const getLeMapUrl = (mapId: string): string | undefined =>
    urlByName.get(`legendary_event_${mapId}`) ?? urlByName.get(mapId);
