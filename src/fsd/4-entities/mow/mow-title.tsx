import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { IMow2 } from './model';

export const MowTitle = ({ mow, onClick }: { mow: IMow2; onClick?: () => void }) => {
    return (
        <div className="flex-box gap5 p5" onClick={onClick}>
            <UnitShardIcon icon={mow.roundIcon} height={35} />
            <span>{mow.name}</span>
        </div>
    );
};
