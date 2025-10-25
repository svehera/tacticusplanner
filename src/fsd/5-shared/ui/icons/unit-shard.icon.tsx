import { getImageUrl } from '../get-image-url';
import { AccessibleTooltip } from '../tooltip';

export const UnitShardIcon = ({
    icon,
    name,
    height,
    width,
    tooltip,
    mythic,
}: {
    icon: string;
    name?: string;
    tooltip?: string;
    height?: number;
    width?: number;
    mythic?: boolean;
}) => {
    const hasIconUrl = icon && icon !== '';
    const imageUrl = hasIconUrl ? getImageUrl(`${icon.replace('.webp', '.png')}`) : '';
    const borderImageUrl = mythic
        ? getImageUrl('snowprint_assets/frames/ui_icon_character_shard_mythic.png')
        : getImageUrl('snowprint_assets/frames/ui_icon_character_shard_empty.png');
    const defaultWidth = 50;
    width = width ?? defaultWidth;
    height = height ?? defaultWidth;
    const roundImgOriginal = { width: 148, height: 148 };
    // The wreath border image was originally 242x210px, with an aspect ratio of 1.15238095.
    // I.e. not a circle/square with equal width and height.
    // To allow the unit's roundIcon to overlay, while allowing dynamic sizing, we're storing the
    // aspect ratio here as a constant. If the underlying wreath image changes, this will need to change.
    const borderImgOriginal = { width: 242, height: 210 };
    const borderImgScale = Math.min(width / borderImgOriginal.width, height / borderImgOriginal.height);
    // `overlayScale` is a magic number that was manually adjusted to center the roundIcon over
    // the wreath border with minimal gaps.
    const overlayScale = 1.25;
    const overlaySize = roundImgOriginal.width * borderImgScale * overlayScale;

    const image = (
        <div style={{ position: 'relative', display: 'inline-block', width, height }}>
            <img
                loading={'lazy'}
                style={{ display: 'block', width, height, borderRadius: '50%', objectFit: 'contain' }}
                src={borderImageUrl}
                alt="character border"
            />
            {hasIconUrl && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
                    <img
                        loading={'lazy'}
                        style={{
                            width: overlaySize,
                            height: overlaySize,
                        }}
                        src={imageUrl}
                        alt={name ?? icon}
                    />
                </div>
            )}
        </div>
    );

    return tooltip ? <AccessibleTooltip title={tooltip}>{image}</AccessibleTooltip> : image;
};
