import React, { useContext, useMemo, useState } from 'react';
import { StoreContext } from 'src/reducers/store.provider';
import { sortBy } from 'lodash';
import { MowLookupInputs } from 'src/v2/features/lookup/mow-lookup-inputs';
import { IMowLookupInputs } from 'src/v2/features/lookup/lookup.models';
import { MowLookupService } from 'src/v2/features/lookup/mow-lookup.service';
import { MowMaterialsTable } from 'src/v2/features/lookup/mow-materials-table';

export const MowLookup = () => {
    const { mows } = useContext(StoreContext);
    const autocompleteOptions = sortBy(mows, 'name');

    const [inputs, setInputs] = useState<IMowLookupInputs>({
        mow: autocompleteOptions[0],
        primaryAbilityStart: 1,
        primaryAbilityEnd: 1,
        secondaryAbilityStart: 1,
        secondaryAbilityEnd: 1,
    });

    const mowMaterials = useMemo(
        () => (inputs.mow ? MowLookupService.getMaterialsList(inputs.mow) : []),
        [inputs.mow?.id]
    );

    return (
        <>
            <MowLookupInputs mows={autocompleteOptions} inputsChange={setInputs} />

            <MowMaterialsTable rows={mowMaterials} />
        </>
    );
};
