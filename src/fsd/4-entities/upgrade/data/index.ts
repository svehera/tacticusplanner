import { IRecipeData } from '../model';

import recipeDataJson from './new-recipe-data.json';

// Cannot be fixed by `mutableCopy(recipeDataJson) satisfies IRecipeData`; data mismatch?
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const recipeDataByName: IRecipeData = recipeDataJson;
