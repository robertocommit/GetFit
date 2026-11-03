<script lang="ts">
  import { effortLevel, effortTrackStyle } from '$lib/effort';
  let { value, name, disabled = false, oninput }: {
    value: number | null; name: string; disabled?: boolean; oninput: (event: Event) => void;
  } = $props();
  const level = $derived(effortLevel(value));
</script>
<div class="mt-3 rounded-2xl border border-black/[0.05] bg-cream p-4">
  <div class="flex items-center justify-between gap-3">
    <div><span class="block text-xs font-extrabold text-ink">Quanto ti ha affaticato?</span><span class="mt-0.5 block text-[0.68rem] text-muted">Un solo valore per tutto l'esercizio</span></div>
    <span class="shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold text-white shadow-sm" style={`background-color: ${level?.color ?? '#6D786F'}`}>{level ? `${value}/4 · ${level.label}` : 'Scegli 1–4'}</span>
  </div>
  <input class="effort-range mt-4 w-full disabled:opacity-50" style={effortTrackStyle(value)} {disabled} type="range" min="1" max="4" step="1" value={value ?? 2} {oninput} aria-label={`Fatica percepita per ${name}, da 1 a 4`} />
  <div class="mt-2 grid grid-cols-4 text-center text-[0.58rem] font-bold leading-3 text-muted"><span>1<br />Leggero</span><span>2<br />Giusto</span><span>3<br />Duro</span><span>4<br />Al limite</span></div>
  <p class="mt-3 text-center text-[0.65rem] font-semibold" style={`color: ${level?.color ?? '#6D786F'}`}>{level?.detail ?? 'Sposta la barra dopo aver finito l’esercizio'}</p>
</div>
