import { getImageUrl } from '@/fsd/5-shared/ui';

export const FactionImage = ({ faction }: { faction: string }) => {
    const imageUrl = getImageUrl(`factions/${faction}.png`);

    return (
        <img
            loading={'lazy'}
            className="pointer-events-none [content-visibility:auto]"
            src={imageUrl}
            width={25}
            alt={faction}
        />
    );
};
