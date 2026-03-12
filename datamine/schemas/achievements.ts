import { z } from 'zod';

import { RaritySchema, RewardSchemaGenerator } from '../utils';

const RewardSchema = RewardSchemaGenerator('gems', 'elderShopCurrency', 'xpMythic');

const AchievementMilestoneSchema = z.strictObject({ goal: z.int(), reward: RewardSchema });

export const AchievementSchema = z.strictObject({
    achievementId: z.string().brand('achievementId'),
    taskId: z.string().brand('taskId'),
    taskTarget: z
        .union([z.int().positive(), RaritySchema, z.literal('gold')])
        .nullish()
        .default(null),
    milestones: z.tuple([AchievementMilestoneSchema, AchievementMilestoneSchema, AchievementMilestoneSchema]),
});
