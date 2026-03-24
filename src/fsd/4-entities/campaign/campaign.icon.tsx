import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const CampaignImage = ({
    campaign,
    size = 50,
    showTooltip = true,
}: {
    campaign: string;
    size?: number;
    showTooltip?: boolean;
}) => {
    const image = getImageUrl(`campaigns/resized/${campaign}.png`);

    const img = (
        <span className="inline-block" style={{ height: size, minWidth: size }}>
            <img className="pointer-events-none" src={image} height={size} alt={campaign} />
        </span>
    );

    if (!showTooltip) return img;

    return <AccessibleTooltip title={campaign}>{img}</AccessibleTooltip>;
};
