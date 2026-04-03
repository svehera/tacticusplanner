import { z } from 'zod';

import { RaritySchema, CountStringSchemaGenerator } from '../utils';

const RewardSchema = CountStringSchemaGenerator('gems', 'elderShopCurrency', 'xpMythic');

const AchievementMilestoneSchema = z.strictObject({ goal: z.int(), reward: RewardSchema });

export const AchievementSchema = z.strictObject({
    achievementId: z.string().brand<'AchievementId'>(),
    taskId: z.string().brand<'TaskId'>(),
    taskTarget: z
        .union([z.int().positive(), RaritySchema, z.literal('gold')])
        .nullish()
        .default(null),
    milestones: z.tuple([AchievementMilestoneSchema, AchievementMilestoneSchema, AchievementMilestoneSchema]),
});
