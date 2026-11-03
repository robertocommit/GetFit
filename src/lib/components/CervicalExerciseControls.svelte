<script lang="ts">
  import type { Exercise, SetLog } from '$lib/types';
  import ExerciseEffort from './ExerciseEffort.svelte';
  let { exercise, logs = $bindable(), disabled = false, onchange }: {
    exercise: Exercise; logs: SetLog[]; disabled?: boolean; onchange: () => void;
  } = $props();
  function number(log: SetLog, key: 'reps' | 'holdSeconds', event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    log[key] = value === '' ? null : Number(value);
    onchange();
  }
  function effort(event: Event) {
    const value = Math.max(1, Math.min(4, Number((event.currentTarget as HTMLInputElement).value)));
    for (const log of logs) log.effort = value;
    onchange();
  }
</script>
<fieldset {disabled} class="space-y-4 disabled:opacity-60">
  <p class="text-sm leading-6 text-muted">Ogni ripetizione è una contrazione: mantienila per i secondi indicati, poi rilascia e ripeti.</p>
  {#each logs as log}
    <div class="rounded-2xl bg-cream p-3">
      <p class="text-sm font-bold">Serie {exercise.target?.perSide ? ((log.setNumber - 1) % exercise.sets) + 1 : log.setNumber}{log.side === 'left' ? ' · Sinistra' : log.side === 'right' ? ' · Destra' : ''}</p>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <label class="text-xs">Ripetizioni<input class="mt-2 w-full rounded-xl bg-white p-3 text-base" type="number" min="1" step="1" value={log.reps ?? ''} oninput={event => number(log, 'reps', event)} /></label>
        <label class="text-xs">Secondi per ripetizione<input class="mt-2 w-full rounded-xl bg-white p-3 text-base" type="number" min="1" step="1" value={log.holdSeconds ?? ''} oninput={event => number(log, 'holdSeconds', event)} /></label>
      </div>
      {#if log.reps !== null && log.holdSeconds != null}
        <p class="mt-3 text-xs font-semibold text-moss">{log.reps} {log.reps === 1 ? 'contrazione' : 'contrazioni'} da {log.holdSeconds} {log.holdSeconds === 1 ? 'secondo' : 'secondi'} ciascuna</p>
      {/if}
    </div>
  {/each}
</fieldset>
<ExerciseEffort value={logs[0]?.effort ?? null} name={exercise.name} {disabled} oninput={effort} />
