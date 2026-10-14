import sizes from './wallpaper-sizes.json';

export type DeviceId = 'mac' | 'macbook' | 'ipad' | 'iphone';

export interface Device {
  id: DeviceId;
  /** short, for the device toggle */
  label: string;
  /** in full, for alt text */
  model: string;
  width: number;
  height: number;
  /** dot-grid cell of the render, in px; finer screens get a finer grid */
  cell: number;
  /** preview width in px: the stage shows it at about half this */
  previewWidth: number;
}

export const DEVICES: Device[] = [
  { id: 'mac', label: 'Mac', model: 'Mac', width: 5120, height: 2880, cell: 16, previewWidth: 1440 },
  { id: 'macbook', label: 'MacBook', model: 'MacBook Pro 16″', width: 3456, height: 2234, cell: 12, previewWidth: 1200 },
  { id: 'ipad', label: 'iPad', model: 'iPad', width: 2752, height: 2064, cell: 12, previewWidth: 1120 },
  { id: 'iphone', label: 'iPhone', model: 'iPhone', width: 1320, height: 2868, cell: 12, previewWidth: 440 },
];

export interface Wallpaper {
  id: string;
  name: string;
  /** file size per device, written by scripts/wallpapers.ts */
  bytes: Record<DeviceId, number>;
}

const NAMES: [string, string][] = [
  ['fe-monolith', 'Monolith'],
  ['fe-motion-study', 'Motion study'],
  ['fe-homepage', 'Homepage'],
  ['fe-macro', 'Macro'],
  ['fe-blueprint', 'Blueprint'],
  ['fe-field', 'Field'],
  ['fe-decode', 'Decode'],
  ['fe-principles', 'Principles'],
  ['fe-boot', 'Boot'],
  ['fe-trail', 'Trail'],
  ['fe-texture', 'Texture'],
  ['cw-bean', 'Claudewitz'],
  ['cw-dissolve', 'Claudewitz · dissolve'],
];

export const WALLPAPERS: Wallpaper[] = NAMES.map(([id, name]) => ({ id, name, bytes: (sizes as Record<string, Record<DeviceId, number>>)[id] }));

export const downloadPath = (id: string, device: DeviceId): string => `/wallpapers/${device}/${id}.png`;
export const previewPath = (id: string, device: DeviceId): string => `/wallpapers/preview/${device}/${id}.png`;
/** the Mac version, small, for the thumbnail strip */
export const thumbPath = (id: string): string => `/wallpapers/thumb/${id}.png`;
export const THUMB_WIDTH = 320;

export const formatBytes = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`);
