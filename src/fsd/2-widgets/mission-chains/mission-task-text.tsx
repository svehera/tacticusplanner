/* eslint-disable import-x/no-internal-modules */
import { Rarity } from '@/fsd/5-shared/model';

import type { IMissionTask } from '@/fsd/4-entities/shops';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';

import { getMissionTaskContent } from './mission-task-content';

/** Renders one mission task's description via `getMissionTaskContent` + the shared `AbilityText` renderer. */
export function MissionTaskText({ task }: { task: IMissionTask }) {
    const content = getMissionTaskContent(task);
    const variables = { ...content.variables, target: [task.target] };

    return (
        <AbilityText
            text={content.text}
            level={1}
            variables={variables}
            constants={content.constants}
            scaledVariableNames={[]}
            rarity={Rarity.Common}
            unitName=""
            factionId=""
        />
    );
}
