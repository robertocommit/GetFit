<script lang="ts">
  import type { Exercise, SetLog, TrainingContext, BandSetup } from '$lib/types';
  let {exercise,logs = $bindable(),context = $bindable(),disabled=false,onchange}: {exercise:Exercise;logs:SetLog[];context:TrainingContext;disabled?:boolean;onchange:()=>void}=$props();
  const bandFields: {key:keyof BandSetup;label:string}[]=[
    {key:'brand',label:'Marca (se conosciuta)'},{key:'model',label:'Modello (se conosciuto)'},{key:'color',label:'Colore'},
    {key:'nominalResistance',label:'Livello nominale del produttore'}, {key:'configuration',label:'Configurazione validata'},
    {key:'anchor',label:'Ancoraggio o presa delle estremità'}, {key:'referenceLength',label:'Distanza / allungamento misurati (con unità)'}
  ];
  function changeBand(key:keyof BandSetup,event:Event){
    context.decisions[exercise.id] ??={};context.decisions[exercise.id].band ??={};
    context.decisions[exercise.id].band![key]=(event.currentTarget as HTMLInputElement).value;onchange();
  }
  function number(log:SetLog,key:'reps'|'holdSeconds'|'effort',event:Event){const v=(event.currentTarget as HTMLInputElement).value;log[key]=v===''?null:Number(v);onchange();}
</script>
<fieldset {disabled} class="space-y-4 disabled:opacity-60">
  {#if exercise.resistanceType==='resistance_band'}
    <p class="text-sm leading-6 text-muted">Resistenza molto leggera, invariata durante novembre. Colori e livelli valgono soltanto per marca, modello e configurazione indicati: nessuna conversione in kg.</p>
    <details><summary class="cursor-pointer text-sm font-bold text-moss">Elastico e configurazione · confronto tra sedute</summary>
      <div class="mt-4 grid gap-4">
        {#each bandFields as field}<label class="block text-sm">{field.label}<input class="mt-2 w-full rounded-2xl bg-cream p-3 text-base" type="text" maxlength="2000" value={context.decisions[exercise.id]?.band?.[field.key] ?? ''} oninput={e=>changeBand(field.key,e)} /></label>{/each}
      </div>
    </details>
  {/if}
  <p class="text-xs text-muted">Valori effettivi per serie: ripetizioni, secondi per contrazione e fatica 1–4. NR resta vuoto.</p>
  {#each logs as log}
    <div class="rounded-2xl bg-cream p-3">
      <p class="text-sm font-bold">Serie {exercise.target?.perSide ? ((log.setNumber-1)%exercise.sets)+1 : log.setNumber}{log.side==='left'?' · Sinistra':log.side==='right'?' · Destra':''}</p>
      <div class="mt-2 grid grid-cols-3 gap-2">
        <label class="text-xs">Ripetizioni<input class="mt-2 w-full rounded-xl bg-white p-2 text-base" type="number" min="1" step="1" value={log.reps ?? ''} oninput={e=>number(log,'reps',e)}/></label>
        <label class="text-xs">Secondi<input class="mt-2 w-full rounded-xl bg-white p-2 text-base" type="number" min="1" step="1" value={log.holdSeconds ?? ''} oninput={e=>number(log,'holdSeconds',e)}/></label>
        <label class="text-xs">Fatica 1–4<input class="mt-2 w-full rounded-xl bg-white p-2 text-base" type="number" min="1" max="4" step="1" placeholder="NR" value={log.effort ?? ''} oninput={e=>number(log,'effort',e)}/></label>
      </div>
    </div>
  {/each}
</fieldset>
