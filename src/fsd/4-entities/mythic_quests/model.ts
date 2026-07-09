import { Alliance } from '@/fsd/5-shared/model';

export interface IMythicQuestTaskRaw {
    locaKey: string;
    name: string;
    target: number;
    taskParameters: Record<string, string>;
}

export interface IMythicQuestRaw {
    number: number;
    name: string;
    rewards: string[];
    tasks: IMythicQuestTaskRaw[];
}

export interface IMythicQuestCharacterRaw {
    characterId: string;
    characterName: string;
    quests: IMythicQuestRaw[];
}

export interface IMythicQuestTermRaw {
    Term: string;
    Languages: string[];
}

export interface IMythicQuestsFileRaw {
    quests: IMythicQuestCharacterRaw[];
    terms: IMythicQuestTermRaw[];
}

export type IMythicQuestRewardIcon =
    | { kind: 'shard'; characterId: string }
    | { kind: 'ascensionOrb'; alliance: Alliance }
    | { kind: 'abilityToken'; alliance: Alliance }
    | { kind: 'xp' }
    | { kind: 'gold' }
    | { kind: 'equipment'; equipmentId: string }
    | { kind: 'unknown'; raw: string };

export interface IMythicQuestReward {
    icon: IMythicQuestRewardIcon;
    label: string;
    quantity: number | undefined;
}

export interface IMythicQuestTask {
    name: string;
    target: number;
    parameters: Record<string, string>;
    variables: Record<string, (string | number)[]>;
    languages: string;
}

export interface IMythicQuest {
    rewards: IMythicQuestReward[];
    tasks: IMythicQuestTask[];
}
