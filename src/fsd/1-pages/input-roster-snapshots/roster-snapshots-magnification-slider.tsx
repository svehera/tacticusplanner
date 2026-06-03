import { ZoomIn, ZoomOut } from 'lucide-react';

import { Slider } from '@/fsd/5-shared/ui';

export const RosterSnapshotsMagnificationSlider = ({
    zoom,
    setZoom,
}: {
    zoom: number;
    setZoom: (value: number) => void;
}) => {
    return (
        <div className="flex items-center gap-2">
            <ZoomOut className="size-4" />
            <div className="min-w-[100px]">
                <Slider min={0.25} max={2} step={0.05} value={zoom} onChange={setZoom} aria-label="unit size" />
            </div>
            <ZoomIn className="size-4" />
        </div>
    );
};
