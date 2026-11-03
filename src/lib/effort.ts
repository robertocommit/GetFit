export const effortLevels = {
  1: { label: 'Leggero', detail: 'Poco sforzo', color: '#315B47' },
  2: { label: 'Giusto', detail: 'Impegnativo ma fluido', color: '#7FA53A' },
  3: { label: 'Duro', detail: 'Fatica evidente', color: '#D38A24' },
  4: { label: 'Al limite', detail: 'Fatica estrema', color: '#C84B31' }
} as const;

export function effortLevel(value: number | null) {
  return value && value in effortLevels ? effortLevels[value as keyof typeof effortLevels] : null;
}

export function effortTrackStyle(value: number | null) {
  const level = effortLevel(value);
  const percentage = value === null ? 0 : ((value - 1) / 3) * 100;
  const color = level?.color ?? '#DDE2DC';
  return `background: linear-gradient(90deg, ${color} 0%, ${color} ${percentage}%, #DDE2DC ${percentage}%, #DDE2DC 100%)`;
}
