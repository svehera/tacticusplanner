/* eslint-disable import-x/no-internal-modules */
import { useEffect, useMemo, useState } from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/assets';

import type { IEquipment } from '../model';

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };

        img.onerror = error => {
            reject(new Error(`Failed to load image from URL: ${url}. Error: ${error}`));
        };

        img.src = url;
    });
}

interface Size {
    width: number;
    height: number;
}

// Helper component for a single centered image layer
const ImageLayer = ({
    url,
    size,
    zIndex,
    scaleFactor,
}: {
    url: string;
    scaleFactor: number;
    size: Size;
    zIndex: number;
}) => {
    const imageStyle = {
        width: size.width,
        height: size.height,

        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(' + scaleFactor + '%, ' + scaleFactor + '%)',

        zIndex: zIndex,
    };

    return (
        <img
            src={url}
            alt={`Layer ${zIndex}`}
            style={{ ...imageStyle, position: 'absolute', pointerEvents: 'none' }}
            loading="lazy"
        />
    );
};

export const EquipmentIcon = ({
    equipment,
    height = 50, // Set default sizes for better control
    width = 50,
    tooltip,
}: {
    equipment: IEquipment;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    const [equipSize, setEquipSize] = useState<Size>({ width: 0, height: 0 });
    const [frameSize, setFrameSize] = useState<Size>({ width: 0, height: 0 });
    const [relicSize, setRelicSize] = useState<Size>({ width: 0, height: 0 });
    const [equipIsLoading, setEquipIsLoading] = useState<boolean>(true);
    const [frameIsLoading, setFrameIsLoading] = useState<boolean>(true);
    const [relicIsLoading, setRelicIsLoading] = useState<boolean>(true);
    const [equipError, setEquipError] = useState<Error | null>(null);
    const [frameError, setFrameError] = useState<Error | null>(null);
    const [relicError, setRelicError] = useState<Error | null>(null);

    const frameKey = (RarityMapper.rarityToRarityString(equipment.rarity).toLocaleLowerCase() +
        'EquipmentFrame') as keyof typeof tacticusIcons;
    const frameDetails = tacticusIcons[frameKey] ?? { file: '', label: frameKey };
    const relicDetails = tacticusIcons['relicEquipmentFrame'] ?? { file: '', label: 'relicEquipmentFrame' };

    // 2. Use the useEffect hook to call the async function
    useEffect(() => {
        if (!equipment.icon) return;

        setEquipIsLoading(true);
        setEquipError(null);
        setEquipSize({ width: 0, height: 0 });

        getImageDimensions(getImageUrl(equipment.icon))
            .then(data => setEquipSize(data))
            .catch(err => setEquipError(err))
            .finally(() => setEquipIsLoading(false));

        getImageDimensions(frameDetails.file)
            .then(data => setFrameSize(data))
            .catch(err => setFrameError(err))
            .finally(() => setFrameIsLoading(false));

        getImageDimensions(relicDetails.file)
            .then(data => setRelicSize(data))
            .catch(err => setRelicError(err))
            .finally(() => setRelicIsLoading(false));

        // The dependency array [imageUrl] ensures this effect runs
        // only when the imageUrl prop changes.
    }, [equipment]);

    // 3. Render based on the state
    if (equipIsLoading || frameIsLoading || relicIsLoading) {
        return <div>Loading...</div>;
    }

    if (equipError) {
        return <div style={{ color: 'red' }}>Error loading image: {equipError.message}</div>;
    }
    if (frameError) {
        return <div style={{ color: 'red' }}>Error loading image: {frameError.message}</div>;
    }
    if (relicError) {
        return <div style={{ color: 'red' }}>Error loading image: {relicError.message}</div>;
    }

    const containerDimensions = useMemo(() => {
        const maxWidth = width;
        const maxHeight = height;

        return { width: maxWidth, height: maxHeight };
    }, [equipSize, frameSize, relicSize]);

    const stackStyle = {
        width: containerDimensions.width,
        height: containerDimensions.height,
        overflow: 'hidden',
    };

    const adjustedEquipSize = {
        width: (equipSize.width / Math.max(equipSize.width, equipSize.height)) * containerDimensions.width,
        height: (equipSize.height / Math.max(equipSize.width, equipSize.height)) * containerDimensions.height,
    };

    const adjustedFrameSize = {
        width: (frameSize.width / Math.max(frameSize.width, frameSize.height)) * containerDimensions.width,
        height: (frameSize.height / Math.max(frameSize.width, frameSize.height)) * containerDimensions.height,
    };

    const adjustedRelicSize = {
        width: (relicSize.width / Math.max(relicSize.width, relicSize.height)) * containerDimensions.width,
        height: (relicSize.height / Math.max(relicSize.width, relicSize.height)) * containerDimensions.height,
    };

    return (
        <AccessibleTooltip title={tooltip ? equipment.name : ''}>
            <div className="layered-image-stack" style={{ ...stackStyle, position: 'relative' }}>
                <ImageLayer url={getImageUrl(equipment.icon)} size={adjustedEquipSize} zIndex={1} scaleFactor={85} />
                <ImageLayer url={frameDetails.file} size={adjustedFrameSize} zIndex={2} scaleFactor={100} />
                {equipment.isRelic && (
                    <ImageLayer url={relicDetails.file} size={adjustedRelicSize} zIndex={3} scaleFactor={100} />
                )}
            </div>
        </AccessibleTooltip>
    );
};
