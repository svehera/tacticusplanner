const bannerUrls = import.meta.glob<string>('../../../assets/images/snowprint_assets/interstitials/*.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
});

const urlByName = new Map(
    Object.entries(bannerUrls).map(([filePath, url]) => [
        filePath
            .split('/')
            .pop()!
            .replace(/\.\w+$/, ''),
        url,
    ])
);

/** @returns the banner image URL for a shop event's `interstitial` file name (e.g. "ui_interstitial_november_2026.png"), if we have one. */
export const getShopEventBannerUrl = (interstitial: string | undefined): string | undefined =>
    interstitial ? urlByName.get(interstitial.replace(/\.\w+$/, '')) : undefined;
