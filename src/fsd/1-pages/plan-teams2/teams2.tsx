/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
/* eslint-disable import-x/order */
import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';
import { ManageTeams } from './manage-teams';

export const Teams2 = () => {
    return (
        <div className="p-6">
            <RosterSnapshotsAssetsProvider>
                <ManageTeams />
            </RosterSnapshotsAssetsProvider>
        </div>
    );
};
