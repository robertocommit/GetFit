<script lang="ts">
  import type { TrainingContext } from '$lib/types';
  import { cervicalSafety } from '$lib/cervical-guides';
  let { context = $bindable(), disabled = false, onchange }: {context:TrainingContext;disabled?:boolean;onchange:()=>void} = $props();
  function pain(field:'painBefore'|'painAfter',event:Event) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    context[field] = raw === '' ? null : Number(raw);
    onchange();
  }
</script>
<section class="card mt-4 p-4">
  <p class="eyebrow">Novembre 2026 · quattro settimane</p>
  <h2 class="mt-2 text-lg font-bold">Forza cervicale — Elastici · Fase 1</h2>
  <p class="mt-2 text-sm leading-6 text-muted">Proposta da validare con il fisioterapista prima della prima esecuzione. Le vecchie isometrie sono sostituite; lo storico resta consultabile. Esegui il blocco dopo gli esercizi principali, soltanto se non sei eccessivamente affaticato. Puoi escluderlo e svolgere il resto della seduta.</p>
  <fieldset {disabled} class="mt-4 space-y-4 disabled:opacity-60">
    <label class="flex items-start gap-2 text-sm"><input type="checkbox" class="mt-1 h-5 w-5 shrink-0" bind:checked={context.physioApproved} onchange={onchange} />Il fisioterapista ha approvato questo programma per me.</label>
    <div class="grid grid-cols-2 gap-4">
      <label class="block text-sm">Dolore prima · 0–10<input class="mt-2 w-full rounded-2xl bg-cream p-3 text-base" type="number" min="0" max="10" step="1" placeholder="NR" value={context.painBefore ?? ''} oninput={e=>pain('painBefore',e)} /></label>
      <label class="block text-sm">Dolore dopo · 0–10<input class="mt-2 w-full rounded-2xl bg-cream p-3 text-base" type="number" min="0" max="10" step="1" placeholder="NR" value={context.painAfter ?? ''} oninput={e=>pain('painAfter',e)} /></label>
    </div>
    <p class="text-xs text-muted">Dolore 0 = assente. NR = non registrato. Questa scala è distinta dalla fatica 1–4.</p>
    <label class="flex items-start gap-2 text-sm"><input type="checkbox" class="mt-1 h-5 w-5 shrink-0" bind:checked={context.symptoms} onchange={onchange} />Ho dolore acuto, vertigini, formicolio, dolore irradiato o debolezza.</label>
    <label class="flex items-start gap-2 text-sm"><input type="checkbox" class="mt-1 h-5 w-5 shrink-0" bind:checked={context.delayedSymptoms} onchange={onchange} />Ho avuto un peggioramento nelle ore successive all’ultimo allenamento.</label>
  </fieldset>
  {#if context.symptoms || context.delayedSymptoms || (context.painBefore ?? 0)>0 || (context.painAfter ?? 0)>0}
    <p class="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800" role="status">Interrompi il lavoro cervicale. Non completare altre serie né aumentare il carico. Per nuovi sintomi neurologici o sintomi progressivi richiedi valutazione medica. Le serie già eseguite restano registrate.</p>
  {/if}
  <details class="mt-4"><summary class="cursor-pointer text-sm font-bold text-moss">Sicurezza e attrezzatura</summary><p class="mt-2 text-sm leading-6 text-muted">{cervicalSafety}</p></details>
</section>
