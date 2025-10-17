import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { sortBy } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from 'src/reducers/store.provider';

import { Alliance } from '@/fsd/5-shared/model';

import { MowsService } from '@/fsd/4-entities/mow';

import { IMowLookupInputs } from './lookup.models';
import { MowLookupInputs } from './mow-lookup-inputs';
import { MowLookupService } from './mow-lookup.service';
import { MowMaterialsTable } from './mow-materials-table';
import { MowMaterialsTotal } from './mow-materials-total';
import { MowUpgradesTable } from './mow-upgrades-table';

export const MowLookup = () => {
    const { inventory, mows } = useContext(StoreContext);

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);

    const autocompleteOptions = sortBy(resolvedMows, 'name');

    const [inputs, setInputs] = useState<IMowLookupInputs>({
        mow: autocompleteOptions[0],
        primaryAbilityStart: 1,
        primaryAbilityEnd: 1,
        secondaryAbilityStart: 1,
        secondaryAbilityEnd: 1,
    });

    const mowMaterials = useMemo(
        () =>
            inputs.mow
                ? MowsService.getMaterialsList(inputs.mow.snowprintId, inputs.mow.name, inputs.mow.alliance as Alliance)
                : [],
        [inputs.mow]
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
                                mowAlliance={inputs.mow.alliance as Alliance}
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
                                mowAlliance={inputs.mow.alliance as Alliance}
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
