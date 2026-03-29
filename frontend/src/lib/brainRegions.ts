export interface RegionDefinition {
  name: string;
  position: [number, number, number];
  color: string;
  marketingLabel: string;
}

export const BRAIN_REGIONS: RegionDefinition[] = [
  { name: 'FFA', position: [0.3, -0.1, 0.2], color: '#ff6b6b', marketingLabel: 'People & Faces' },
  { name: 'PPA', position: [-0.3, -0.1, 0.1], color: '#4ecdc4', marketingLabel: 'Places & Scenes' },
  { name: "Broca's Area", position: [-0.4, 0.1, 0.3], color: '#45b7d1', marketingLabel: 'Language Processing' },
  { name: 'TPJ', position: [0.4, 0.1, 0.0], color: '#f9ca24', marketingLabel: 'Emotional Response' },
  { name: 'Auditory Cortex', position: [0.5, 0.0, 0.1], color: '#6c5ce7', marketingLabel: 'Sound & Music' },
  { name: 'Visual Cortex', position: [0.0, -0.2, -0.5], color: '#a29bfe', marketingLabel: 'Visual Impact' },
  { name: 'Amygdala', position: [0.2, -0.2, 0.0], color: '#fd79a8', marketingLabel: 'Intensity & Urgency' },
];
