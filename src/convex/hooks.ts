import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';

import { api } from './convex-api';

/*
Intro for people not familiar with this tooling:
- `@tanstack/react-query` is a tool for handling all the ugliness of "server state" (i.e. loading states, errors states, cacheing, etc...)
- `convex` is a backend/database built for syncing data between frontend and backend
- Convex does most of the work, but ReactQuery gives us a better DX around loading and error states
- Convex is also integrated with the auth provuder (Clerk) so you don't have to worry about it
- The Convex API defintions live in another repo and the definitions are exported here: https://stack.convex.dev/multiple-repos

Because this is an open-source project we don't expect people to have experience with these tools.
We provide the following convenience hooks to make it easier to dive in.
It is not required that you use them, so if your case needs something a little different then just use the tools directly.

Cheatsheet of important terms:
- Query: An asyncronous data request
  - `isPending` / `status === 'pending'`: The data hasn't loaded yet
  - `isError` / `status === 'error'`: The query failed with an error
  - `isSuccess` / `status === 'success'`: The query was successful and data is available
  - Rule out the `isPending` and `isError` conditions and the TypeScript will narrow down that the data is available
- Mutation: An asyncronous data update
  - `isIdle` / `status === 'idle'` - The mutation is currently idle or in a fresh/reset state
  - `isPending` / `status === 'pending'` - The mutation is currently running
  - `isError` / `status === 'error'` - The mutation encountered an error
  - `isSuccess` / `status === 'success'` - The mutation was successful and mutation data is available
*/

// This is just a convenience function to wrap the setup when we want data
export const useConvexUserDataQuery = () => useQuery(convexQuery(api.legacy_data.getLegacyData));

/*
This is another convenience function for updating the settings.

The API is currently written as an `upsert` endpoint. This requires that the full settings object be provided.
To make this easier for code that only wants to update specific fields, I've wrapped the mutation code
to allow for patching specific fields.
*/
type MutationDataArgument = Parameters<typeof useConvexMutation<typeof api.legacy_data.upsertLegacyData>>[0]['_args'];
export const useConvexUserDataMutation = () => {
    const query = useConvexUserDataQuery();
    const mutation = useMutation({
        mutationFn: useConvexMutation(api.legacy_data.upsertLegacyData),
        onError: error => {
            console.error(error);
            enqueueSnackbar(`Failed to update settings: ${error.message}`, { variant: 'error' });
        },
    });
    return (patch: Partial<MutationDataArgument>) => {
        if (query.isError) throw new Error(`Failure to load original settings: ${query.error.message}`);
        if (query.isPending) throw new Error('Must complete loading original settings before updating them');
        return mutation.mutate({ ...query.data, ...patch });
    };
};
