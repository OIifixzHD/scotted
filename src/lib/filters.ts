export interface VideoFilter {
  id: string;
  name: string;
  class: string;
}
export const VIDEO_FILTERS: VideoFilter[] = [
  { id: 'none', name: 'Normal', class: '' },
  { id: 'cyberpunk', name: 'Cyberpunk', class: 'contrast-125 saturate-150 hue-rotate-15' },
  { id: 'noir', name: 'Noir', class: 'grayscale contrast-125 brightness-90' },
  { id: 'vhs', name: 'VHS', class: 'contrast-125 saturate-150 sepia-[.3]' },
  { id: 'dreamy', name: 'Dreamy', class: 'brightness-110 contrast-90 saturate-150' },
  { id: 'matrix', name: 'Matrix', class: 'hue-rotate-90 contrast-125 saturate-150' },
  { id: 'vintage', name: 'Vintage', class: 'sepia contrast-110 brightness-90' },
  { id: 'acid', name: 'Acid', class: 'hue-rotate-[-45deg] contrast-125 saturate-200' },
];
export function getFilterClass(filterId?: string): string {
  const filter = VIDEO_FILTERS.find(f => f.id === filterId);
  return filter ? filter.class : '';
}