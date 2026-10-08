import { SHAPE_NAMES } from '@/lib/model.mjs';
export const partNames = {
  shade: 'Shade',
  base: 'Base',
  lid: 'Lid',
  diffuser: 'Diffuser',
};
export const finishes = [
  { name: 'Limestone', hex: '#c9bda5' },
  { name: 'Satin black', hex: '#343331' },
  { name: 'Walnut', hex: '#74513d' },
  { name: 'Stone grey', hex: '#90918d' },
  { name: 'Warm white', hex: '#f4eddf' },
];
export const stages = [
  {
    id: 'start',
    name: 'Start',
    title: 'Choose a starting point',
    description: 'Open a project or find a form to build on.',
  },
  {
    id: 'form',
    name: 'Form',
    title: 'Shape the whole lamp',
    description: 'Establish the silhouette, then refine each part.',
  },
  {
    id: 'surface',
    name: 'Surface',
    title: 'Give it character',
    description: 'Explore texture and preview finishes.',
  },
  {
    id: 'parts',
    name: 'Parts & fit',
    title: 'Bring the parts together',
    description: 'Set the connections and optional components.',
  },
  {
    id: 'review',
    name: 'Review',
    title: 'Inspect your design',
    description: 'Check assembly, clearances and printer dimensions.',
  },
  {
    id: 'export',
    name: 'Export',
    title: 'Take it to print',
    description: 'Download each part and keep an editable project.',
  },
] as const;
export const displayName = (value: string) =>
  (SHAPE_NAMES as Record<string, string>)[value] ||
  value.replaceAll('-', ' ').replace(/^./, (c) => c.toUpperCase());
