import { FC, lazy, Suspense } from 'react';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';

const MaterialsTable = lazy(() =>
    import('@/fsd/3-features/goals/materials-table').then(m => ({ default: m.MaterialsTable }))
);
const RaidUpgradeMaterialCard = lazy(() =>
    import('./raid-upgrade-material-card').then(m => ({ default: m.RaidUpgradeMaterialCard }))
);

interface MaterialsSectionContentProps {
    materials: ICharacterUpgradeEstimate[];
    tableView: boolean;
    updateInventory: (materialId: string, value: number) => void;
    inventory: Record<string, number>;
    onGridReady?: () => void;
    scrollToCharSnowprintId?: string;
    alreadyUsedMaterials?: ICharacterUpgradeEstimate[];
    showAdditionalInfo?: boolean;
    cardRefCallback?: (index: number) => (element: HTMLDivElement | null) => void;
}

export const MaterialsSectionContent: FC<MaterialsSectionContentProps> = ({
    materials,
    tableView,
    updateInventory,
    inventory,
    onGridReady,
    scrollToCharSnowprintId,
    alreadyUsedMaterials,
    showAdditionalInfo = true,
    cardRefCallback,
}) => {
    if (tableView) {
        return (
            <div className="ag-theme-material flex h-[600px] min-h-[150px] w-full flex-col">
                <Suspense fallback={undefined}>
                    <MaterialsTable
                        rows={materials}
                        updateMaterialQuantity={updateInventory}
                        onGridReady={onGridReady ?? (() => {})}
                        inventory={inventory}
                        scrollToCharSnowprintId={scrollToCharSnowprintId}
                        alreadyUsedMaterials={alreadyUsedMaterials}
                    />
                </Suspense>
            </div>
        );
    }

    return (
        <Suspense fallback={undefined}>
            <div className="flex max-h-[600px] w-full flex-wrap gap-x-4 gap-y-4 overflow-y-auto py-2 min-[354px]:px-2">
                {materials.map((material, index) => (
                    <div key={material.id} ref={cardRefCallback ? cardRefCallback(index) : undefined}>
                        <RaidUpgradeMaterialCard upgradeEstimate={material} showAdditionalInfo={showAdditionalInfo} />
                    </div>
                ))}
            </div>
        </Suspense>
    );
};
