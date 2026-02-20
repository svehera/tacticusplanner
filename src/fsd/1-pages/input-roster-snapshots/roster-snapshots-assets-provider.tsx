/* eslint-disable import-x/no-internal-modules */
import { useMemo } from 'react';
import useImage from 'use-image';

import { getImageUrl } from '@/fsd/5-shared/ui';
import { starsIcons, tacticusIcons } from '@/fsd/5-shared/ui/icons/iconList';

import { AssetContext } from './roster-snapshots-assets-context';

interface RosterSnapshotsAssetsProviderProps {
    children: React.ReactNode;
}

export const RosterSnapshotsAssetsProvider: React.FC<RosterSnapshotsAssetsProviderProps> = ({
    children,
}: RosterSnapshotsAssetsProviderProps) => {
    const charFrameCommon = useImage(tacticusIcons['commonFrame'].file);
    const charFrameUncommon = useImage(tacticusIcons['uncommonFrame'].file);
    const charFrameRare = useImage(tacticusIcons['rareFrame'].file);
    const charFrameEpic = useImage(tacticusIcons['epicFrame'].file);
    const charFrameLegendary = useImage(tacticusIcons['legendaryFrame'].file);
    const charFrameMythic = useImage(tacticusIcons['mythicFrame'].file);

    const mowFrameCommon = useImage(tacticusIcons['mowCommonFrame'].file);
    const mowFrameUncommon = useImage(tacticusIcons['mowUncommonFrame'].file);
    const mowFrameRare = useImage(tacticusIcons['mowRareFrame'].file);
    const mowFrameEpic = useImage(tacticusIcons['mowEpicFrame'].file);
    const mowFrameLegendary = useImage(tacticusIcons['mowLegendaryFrame'].file);
    const mowFrameMythic = useImage(tacticusIcons['mowMythicFrame'].file);

    const rankIconStone1 = useImage(getImageUrl('ranks/stone1.png'));
    const rankIconStone2 = useImage(getImageUrl('ranks/stone2.png'));
    const rankIconStone3 = useImage(getImageUrl('ranks/stone3.png'));
    const rankIconIron1 = useImage(getImageUrl('ranks/iron1.png'));
    const rankIconIron2 = useImage(getImageUrl('ranks/iron2.png'));
    const rankIconIron3 = useImage(getImageUrl('ranks/iron3.png'));
    const rankIconBronze1 = useImage(getImageUrl('ranks/bronze1.png'));
    const rankIconBronze2 = useImage(getImageUrl('ranks/bronze2.png'));
    const rankIconBronze3 = useImage(getImageUrl('ranks/bronze3.png'));
    const rankIconSilver1 = useImage(getImageUrl('ranks/silver1.png'));
    const rankIconSilver2 = useImage(getImageUrl('ranks/silver2.png'));
    const rankIconSilver3 = useImage(getImageUrl('ranks/silver3.png'));
    const rankIconGold1 = useImage(getImageUrl('ranks/gold1.png'));
    const rankIconGold2 = useImage(getImageUrl('ranks/gold2.png'));
    const rankIconGold3 = useImage(getImageUrl('ranks/gold3.png'));
    const rankIconDiamond1 = useImage(getImageUrl('ranks/diamond1.png'));
    const rankIconDiamond2 = useImage(getImageUrl('ranks/diamond2.png'));
    const rankIconDiamond3 = useImage(getImageUrl('ranks/diamond3.png'));
    const rankIconAdamantine1 = useImage(getImageUrl('snowprint_assets/ranks/ui_icon_rank_mythical_01.png'));
    const rankIconAdamantine2 = useImage(getImageUrl('snowprint_assets/ranks/ui_icon_rank_mythical_02.png'));
    const rankIconAdamantine3 = useImage(getImageUrl('snowprint_assets/ranks/ui_icon_rank_mythical_03.png'));

    const goldStar = useImage(starsIcons.goldStar);
    const redStar = useImage(starsIcons.redStar);
    const blueStar = useImage(starsIcons.blueStar);
    const mythicWings = useImage(starsIcons.mythicWings);

    const shardIcon = useImage(tacticusIcons.shard.file);
    const mythicShardIcon = useImage(tacticusIcons.mythicShard.file);

    const value = useMemo(() => {
        return {
            charFrames: [
                charFrameCommon,
                charFrameUncommon,
                charFrameRare,
                charFrameEpic,
                charFrameLegendary,
                charFrameMythic,
            ],
            mowFrames: [
                mowFrameCommon,
                mowFrameUncommon,
                mowFrameRare,
                mowFrameEpic,
                mowFrameLegendary,
                mowFrameMythic,
            ],
            ranks: [
                rankIconStone1,
                rankIconStone2,
                rankIconStone3,
                rankIconIron1,
                rankIconIron2,
                rankIconIron3,
                rankIconBronze1,
                rankIconBronze2,
                rankIconBronze3,
                rankIconSilver1,
                rankIconSilver2,
                rankIconSilver3,
                rankIconGold1,
                rankIconGold2,
                rankIconGold3,
                rankIconDiamond1,
                rankIconDiamond2,
                rankIconDiamond3,
                rankIconAdamantine1,
                rankIconAdamantine2,
                rankIconAdamantine3,
            ],
            stars: [goldStar, redStar, blueStar, mythicWings],
            shardIcon,
            mythicShardIcon,
        };
    }, [
        charFrameCommon,
        charFrameUncommon,
        charFrameRare,
        charFrameEpic,
        charFrameLegendary,
        charFrameMythic,
        mowFrameCommon,
        mowFrameUncommon,
        mowFrameRare,
        mowFrameEpic,
        mowFrameLegendary,
        mowFrameMythic,
        rankIconStone1,
        rankIconStone2,
        rankIconStone3,
        rankIconIron1,
        rankIconIron2,
        rankIconIron3,
        rankIconBronze1,
        rankIconBronze2,
        rankIconBronze3,
        rankIconSilver1,
        rankIconSilver2,
        rankIconSilver3,
        rankIconGold1,
        rankIconGold2,
        rankIconGold3,
        rankIconDiamond1,
        rankIconDiamond2,
        rankIconDiamond3,
        rankIconAdamantine1,
        rankIconAdamantine2,
        rankIconAdamantine3,
        goldStar,
        redStar,
        blueStar,
        mythicWings,
        shardIcon,
        mythicShardIcon,
    ]);
    return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
};
