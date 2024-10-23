import React, { useContext, useMemo, useState } from 'react';
import { sortBy } from 'lodash';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { StoreContext } from 'src/reducers/store.provider';
import { MowLookupInputs } from 'src/v2/features/lookup/mow-lookup-inputs';
import { IMowLookupInputs } from 'src/v2/features/lookup/lookup.models';
import { MowLookupService } from 'src/v2/features/lookup/mow-lookup.service';
import { MowMaterialsTable } from 'src/v2/features/lookup/mow-materials-table';
import { MowMaterialsTotal } from 'src/v2/features/lookup/mow-materials-total';
import { MowUpgradesTable } from 'src/v2/features/lookup/mow-upgrades-table';

export const MowLookup = () => {
    const { mows, inventory } = useContext(StoreContext);
    const autocompleteOptions = sortBy(mows, 'name');

    const [inputs, setInputs] = useState<IMowLookupInputs>({
        mow: autocompleteOptions[0],
        primaryAbilityStart: 1,
        primaryAbilityEnd: 1,
        secondaryAbilityStart: 1,
        secondaryAbilityEnd: 1,
    });

    const mowMaterials = useMemo(
        () =>
            inputs.mow ? MowLookupService.getMaterialsList(inputs.mow.id, inputs.mow.name, inputs.mow.alliance) : [],
        [inputs.mow?.id]
    );

    const maxedTotal = useMemo(() => MowLookupService.getTotals(mowMaterials, 2), [mowMaterials]);
    const upgradesTotal = useMemo(
        () =>
            MowLookupService.getUpgradesList(mowMaterials.flatMap(x => [...x.primaryUpgrades, ...x.secondaryUpgrades])),
        [mowMaterials]
    );

    const primaryAbility = mowMaterials.slice(inputs.primaryAbilityStart - 1, inputs.primaryAbilityEnd - 1);
    const secondaryAbility = mowMaterials.slice(inputs.secondaryAbilityStart - 1, inputs.secondaryAbilityEnd - 1);

    const customTotal = useMemo(() => {
        return MowLookupService.getTotals([...primaryAbility, ...secondaryAbility]);
    }, [primaryAbility, secondaryAbility]);

    const customUpgrades = useMemo(() => {
        return MowLookupService.getUpgradesList([
            ...primaryAbility.flatMap(x => x.primaryUpgrades),
            ...secondaryAbility.flatMap(x => x.secondaryUpgrades),
        ]);
    }, [primaryAbility, secondaryAbility]);

    return (
        <>
            <MowLookupInputs mows={autocompleteOptions} inputs={inputs} inputsChange={setInputs} />

            {inputs.mow && (
                <>
                    <Accordion defaultExpanded={true}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <MowMaterialsTotal
                                label="Upgrades Needed for Selected Levels:"
                                mowAlliance={inputs.mow.alliance}
                                total={customTotal}
                            />
                        </AccordionSummary>
                        <AccordionDetails>
                            <MowUpgradesTable rows={customUpgrades} upgrades={inventory.upgrades} />
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded={false}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <MowMaterialsTotal
                                label="Complete Upgrade Table:"
                                mowAlliance={inputs.mow.alliance}
                                total={maxedTotal}
                            />
                        </AccordionSummary>
                        <AccordionDetails className="flex-box gap20">
                            <MowMaterialsTable rows={mowMaterials} />
                            <MowUpgradesTable rows={upgradesTotal} upgrades={inventory.upgrades} />
                        </AccordionDetails>
                    </Accordion>
                </>
            )}
        </>
    );
};
