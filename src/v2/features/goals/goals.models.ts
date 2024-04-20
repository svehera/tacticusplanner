import { PersonalGoalType, Rank, Rarity } from 'src/models/enums';
import { ICharacter2 } from 'src/models/interfaces';

export type CharacterRaidGoalSelect = ICharacterUpgradeRankGoal | ICharacterAscendGoal;

export interface ICharacterRaidGoalSelectBase {
    include: boolean;
    goalId: string;
    characterName: string;
    characterIcon: string;
}

export interface ICharacterUpgradeRankGoal extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.UpgradeRank;

    rankStart: Rank;
    rankEnd: Rank;
    appliedUpgrades: string[];
    rankPoint5: boolean;
}

export interface ICharacterAscendGoal extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.Ascend;

    rarityStart: Rarity;
    rarityEnd: Rarity;
}
