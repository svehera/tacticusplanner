import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Rank } from '@/fsd/5-shared/model';

import { NpcPortrait } from './npc-portrait';
import { NpcService } from './npc-service';

describe('NpcPortrait', () => {
    it('renders an image given the icon path in the snowprint data', () => {
        const npc = NpcService.npcDataFull[0];
        render(<NpcPortrait id={npc.snowprintId} rank={Rank.Iron1} stars={4} />);
        const img = screen.getByAltText('portrait');
        expect(img).toHaveAttribute('src', expect.stringContaining(npc.icon));
    });
});
