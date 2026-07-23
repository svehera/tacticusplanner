import { tacticusIcons } from './icon-list';

const DEFAULT_SIZE = 32;

/** Generic "unknown item" silhouette composited with a rarity-colored equipment frame — used for
 *  rewards that are only ever specified by rarity (no concrete item id), e.g. product-calendar and
 *  HSE "items{Rarity}" rewards. There's nothing faction/theme-specific about the art. */
export const UnknownItemImage = ({ rarity, size = DEFAULT_SIZE }: { rarity: string; size?: number }) => {
    const isRelic = rarity === 'Relic';
    const baseFrameKey = `${isRelic ? 'mythic' : rarity.toLowerCase()}EquipmentFrame` as keyof typeof tacticusIcons;
    const baseFrame = tacticusIcons[baseFrameKey];
    const relicFrame = isRelic ? tacticusIcons.relicEquipmentFrame : undefined;
    const item = tacticusIcons.itemUnknown;

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <img
                src={item?.file}
                alt=""
                className="pointer-events-none absolute inset-0 m-auto object-contain"
                style={{ width: size * 0.7, height: size * 0.7 }}
            />
            {baseFrame && (
                <img
                    src={baseFrame.file}
                    alt=""
                    className="pointer-events-none absolute inset-0 m-auto object-contain"
                    style={{ width: size, height: size }}
                />
            )}
            {relicFrame && (
                <img
                    src={relicFrame.file}
                    alt=""
                    className="pointer-events-none absolute inset-0 m-auto object-contain"
                    style={{ width: size, height: size }}
                />
            )}
        </div>
    );
};
