import React, { forwardRef } from 'react';

import { Accordion, AccordionHeader, AccordionBody } from '@/fsd/5-shared/ui';

interface SectionAccordionProps {
    expanded: boolean;
    onChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
    summary: React.ReactNode;
    children: React.ReactNode;
    transitionProps?: unknown;
}

export const SectionAccordion = forwardRef<HTMLDivElement, SectionAccordionProps>(
    ({ expanded, onChange, summary, children }, reference) => (
        <div ref={reference}>
            <Accordion
                expanded={expanded}
                onToggle={isExpanded => onChange({} as React.SyntheticEvent, isExpanded)}
                className="rounded-none border-0 border-t border-(--border) bg-transparent shadow-none">
                <AccordionHeader className="bg-transparent px-4 py-1.5">{summary}</AccordionHeader>
                <AccordionBody className="px-0 pt-0 pb-4 min-[354px]:px-2">{children}</AccordionBody>
            </Accordion>
        </div>
    )
);

SectionAccordion.displayName = 'SectionAccordion';
