/**
 * Map Service & Tile / Icon Abstraction Layer
 * File: src/lib/services/mapService.ts
 *
 * Provider-abstracted Leaflet map configuration and SVG marker icon factories.
 * Ensures zero dependency on Google Maps or proprietary mapping APIs.
 *
 * Architectural Guarantees:
 * 1. Strict anchor positioning: Bottom-center tip [width/2, height] for pins, [width/2, height/2] for icons.
 * 2. Zero rogue CSS translate(-50%, -100%) or translate(-50%, -50%) shifts inside icon wrappers.
 * 3. Zoom-responsive campus marker:
 *    - Zoom >= 14: Full institutional badge with school name.
 *    - Zoom 11..13: Compact 🏫 pin.
 *    - Zoom <= 10: Center-anchored solid POI dot.
 *    All 3 representations anchor to the exact same [latitude, longitude].
 */

import type L from 'leaflet';
import type { Coordinates } from '@/components/schools/maps/mapTypes';

// Configurable OpenStreetMap / custom tile layer endpoint
export const DEFAULT_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export const DEFAULT_MAP_CENTER: Coordinates = {
  latitude: 26.65,
  longitude: 84.90, // Default Motihari / North Bihar coordinate center
};

export interface CampusIconOptions {
  zoomLevel?: number;
  isAdjusting?: boolean;
}

/**
 * Creates a Leaflet DivIcon for the School Campus Anchor with zoom-responsive presentation.
 * Anchors strictly to the geographic coordinate at every zoom tier without drifting.
 */
export function createCampusIcon(
  LInstance: typeof L,
  campusName: string = 'Campus',
  optionsOrAdjusting: boolean | CampusIconOptions = false
): L.DivIcon {
  const options: CampusIconOptions =
    typeof optionsOrAdjusting === 'boolean'
      ? { isAdjusting: optionsOrAdjusting }
      : optionsOrAdjusting || {};

  const isAdjusting = Boolean(options.isAdjusting);
  const zoom = typeof options.zoomLevel === 'number' ? options.zoomLevel : 14;

  // 1. Dragging / Positioning Mode in Route Builder
  if (isAdjusting) {
    const width = 160;
    const height = 70;
    return LInstance.divIcon({
      className: 'campus-marker-icon campus-marker-adjusting',
      html: `
        <div style="
          width: ${width}px;
          height: ${height}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          margin: 0;
          padding: 0;
          pointer-events: auto;
          cursor: grab;
        ">
          <div style="
            background: #4338CA;
            color: white;
            width: 42px;
            height: 42px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #818CF8;
            box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.45), 0 8px 20px rgba(67, 56, 202, 0.55);
            font-size: 20px;
          ">
            🏫
          </div>
          <div style="
            background: #312E81;
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 6px;
            margin-top: 2px;
            border: 1px solid #A5B4FC;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            white-space: nowrap;
          ">
            📍 Drag Pin to Move
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid #312E81;
          "></div>
        </div>
      `,
      iconSize: [width, height],
      iconAnchor: [width / 2, height],
    });
  }

  // 2. Low Zoom (zoom <= 10): Minimal solid POI dot anchored at exact center
  if (zoom <= 10) {
    const size = 16;
    return LInstance.divIcon({
      className: 'campus-marker-icon campus-marker-low-zoom',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          pointer-events: auto;
          cursor: pointer;
        ">
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #1E1B4B;
            border: 2.5px solid white;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
          "></div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // 3. Medium Zoom (zoom 11..13): Compact pin icon with pointer
  if (zoom < 14) {
    const width = 44;
    const height = 48;
    return LInstance.divIcon({
      className: 'campus-marker-icon campus-marker-med-zoom',
      html: `
        <div style="
          width: ${width}px;
          height: ${height}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          margin: 0;
          padding: 0;
          pointer-events: auto;
          cursor: pointer;
        ">
          <div style="
            background: #1E1B4B;
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2.5px solid white;
            box-shadow: 0 3px 10px rgba(30, 27, 75, 0.45);
            font-size: 16px;
          ">
            🏫
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid #1E1B4B;
          "></div>
        </div>
      `,
      iconSize: [width, height],
      iconAnchor: [width / 2, height],
    });
  }

  // 4. Normal / High Zoom (zoom >= 14): Full institutional badge with school name
  const width = 160;
  const height = 68;
  const safeName = campusName || 'School Campus';

  return LInstance.divIcon({
    className: 'campus-marker-icon campus-marker-high-zoom',
    html: `
      <div style="
        width: ${width}px;
        height: ${height}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        margin: 0;
        padding: 0;
        pointer-events: auto;
        cursor: pointer;
      ">
        <div style="
          background: #1E1B4B;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid white;
          box-shadow: 0 4px 12px rgba(30, 27, 75, 0.45);
          font-size: 17px;
        ">
          🏫
        </div>
        <div style="
          background: #1E1B4B;
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 2px;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          ${safeName}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #1E1B4B;
        "></div>
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });
}

/**
 * Creates a Leaflet DivIcon for an Ordered Pickup Stop.
 * Anchors strictly to the center of the circular badge.
 */
export function createStopIcon(
  LInstance: typeof L,
  sequence: number,
  color: string,
  isDraggable: boolean = false
): L.DivIcon {
  const size = 28;
  return LInstance.divIcon({
    className: 'stop-marker-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 0;
        cursor: ${isDraggable ? 'grab' : 'pointer'};
      ">
        <div style="
          background: ${color};
          color: white;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          font-family: system-ui, -apple-system, sans-serif;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          ${isDraggable ? 'animation: pulse 1.5s infinite;' : ''}
        ">
          ${sequence}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Creates a Leaflet DivIcon for a Temporary / Draggable Placement Pin.
 * Anchors strictly to the bottom tip of the pin.
 */
export function createTemporaryStopIcon(LInstance: typeof L, color: string = '#4338CA'): L.DivIcon {
  const width = 36;
  const height = 52;
  return LInstance.divIcon({
    className: 'temp-stop-icon',
    html: `
      <div style="
        width: ${width}px;
        height: ${height}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        margin: 0;
        padding: 0;
        cursor: grab;
      ">
        <div style="
          background: ${color};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        ">
          <div style="transform: rotate(45deg); font-size: 16px; font-weight: bold;">+</div>
        </div>
        <div style="
          background: #131B2E;
          color: white;
          font-size: 8px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          margin-top: 2px;
          white-space: nowrap;
        ">
          Drag to Position
        </div>
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });
}

/**
 * Creates a Leaflet DivIcon for the Live School Bus Marker.
 * Renders an authentic polished SVG school bus with center-anchored rotation.
 */
export function createBusIcon(
  LInstance: typeof L,
  options: {
    color?: string;
    heading?: number | null;
    isLive?: boolean;
    routeCode?: string;
  } = {}
): L.DivIcon {
  const { color = '#F59E0B', heading = null, isLive = true, routeCode = '' } = options;
  const hasHeading = typeof heading === 'number' && !Number.isNaN(heading);
  const normalizedHeading = hasHeading ? (((heading! % 360) + 360) % 360) : null;
  // Bus image faces right by default (0°–180°). Flip when heading is westward (180°–360°).
  const flipX = normalizedHeading !== null && normalizedHeading > 180 && normalizedHeading < 360 ? -1 : 1;
  const size = 72;

  return LInstance.divIcon({
    className: 'live-bus-marker-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 0;
        pointer-events: auto;
      ">
        ${isLive ? `
          <div style="
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            background: #10B981;
            color: white;
            font-size: 8px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 9999px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            box-shadow: 0 1px 4px rgba(16, 185, 129, 0.4);
            display: flex;
            align-items: center;
            gap: 3px;
            white-space: nowrap;
            z-index: 10;
          ">
            <span style="width: 4px; height: 4px; border-radius: 50%; background: white;"></span>
            LIVE
          </div>
        ` : ''}

        <div style="
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: scaleX(${flipX});
          transition: transform 0.3s ease;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
        ">
          <img src="/images/bus.webp" alt="School Bus" style="
            width: 100%;
            height: 100%;
            object-fit: contain;
          " />
        </div>

        ${routeCode ? `
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: #1E1B4B;
            color: white;
            font-size: 8px;
            font-weight: 800;
            padding: 0.5px 5px;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            z-index: 10;
          ">
            ${routeCode}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
