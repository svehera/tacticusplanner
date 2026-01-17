import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { EquipmentService } from '../equipment.service';

import { EquipmentIcon } from './equipment-icon';

describe('EquipmentIcon', () => {
    it('renders an image given the icon path in the snowprint data', () => {
        const equipment = EquipmentService.equipmentData[0];
        render(<EquipmentIcon equipment={equipment} />);
        expect(screen.getByAltText(`${equipment.name} image`)).toBeInTheDocument();
    });
});
