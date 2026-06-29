import { type ReactNode, useMemo } from 'react';

import { Rarity } from '@/fsd/5-shared/model';

import type { AbilityContext, AstNode, StyledNode, VariableNode } from './ability-text';
import {
    ABILITY_COLORS,
    FACTION_COLORS,
    getStyleSpec,
    parseAbilityText,
    resolveDynamicStyle,
    resolveI2p,
    resolveVariable,
} from './ability-text';

// ── Segment renderer ──────────────────────────────────────────────────────────

function renderVariable(node: VariableNode, context: AbilityContext, inheritStyle: boolean): ReactNode {
    if (node.isUnitName) {
        if (inheritStyle) return context.unitName;
        const color = FACTION_COLORS[context.factionId] ?? ABILITY_COLORS.stat;
        return <span style={{ color }}>{context.unitName}</span>;
    }
    const value = resolveVariable(node, context);
    if (value === undefined) return undefined;
    if (inheritStyle) return value;
    return <span style={{ color: ABILITY_COLORS.stat }}>{value}</span>;
}

function renderStyled(node: StyledNode, context: AbilityContext, keyPrefix: string): ReactNode {
    const styleName = node.isDynamic ? resolveDynamicStyle(node.styleName, context.constants) : node.styleName;
    const spec = getStyleSpec(styleName);

    const children = renderNodes(node.children, context, keyPrefix, true);

    if (!spec) {
        return <span key={keyPrefix}>{children}</span>;
    }

    const outerStyle: React.CSSProperties = {};
    if (spec.gradient) {
        outerStyle.backgroundImage = spec.gradient;
        outerStyle.WebkitBackgroundClip = 'text';
        outerStyle.WebkitTextFillColor = 'transparent';
        outerStyle.backgroundClip = 'text';
    } else if (spec.color) {
        outerStyle.color = spec.color;
    }
    if (spec.italic) outerStyle.fontStyle = 'italic';

    const content = spec.overrideText ?? children;

    const inner = (
        <>
            {spec.icon && (
                <img src={spec.icon} alt={spec.iconAlt ?? ''} className="mr-0.5 inline h-4 w-4 align-middle" />
            )}
            {content}
        </>
    );

    return (
        <span key={keyPrefix} style={outerStyle}>
            {spec.underline ? (
                <span style={{ borderBottom: '1px solid currentColor', paddingBottom: '1px' }}>{inner}</span>
            ) : (
                inner
            )}
        </span>
    );
}

function renderNodes(nodes: AstNode[], context: AbilityContext, keyPrefix: string, inheritStyle = false): ReactNode[] {
    return nodes.map((node, index) => {
        const key = `${keyPrefix}-${index}`;
        if (node.type === 'text') return <span key={key}>{node.value}</span>;
        if (node.type === 'var') return <span key={key}>{renderVariable(node, context, inheritStyle)}</span>;
        return renderStyled(node, context, key);
    });
}

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
    text: string;
    level: number;
    variables: Record<string, (string | number)[]>;
    constants: Record<string, string>;
    scaledVariableNames: readonly string[];
    rarity: Rarity;
    unitName: string;
    factionId: string;
}

export const AbilityText = ({
    text,
    level,
    variables,
    constants,
    scaledVariableNames,
    rarity,
    unitName,
    factionId,
}: Props) => {
    const ast = useMemo(() => parseAbilityText(resolveI2p(text, level, variables)), [text, level, variables]);
    const scaledSet = useMemo(() => new Set(scaledVariableNames), [scaledVariableNames]);
    const context: AbilityContext = {
        level,
        variables,
        constants,
        scaledVariableNames: scaledSet,
        rarity,
        unitName,
        factionId,
    };
    return <p className="text-xs leading-relaxed text-(--fg)">{renderNodes(ast, context, 'root')}</p>;
};
