<script lang="ts">
  import { BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, Check, ChevronLeft, ChevronRight, CircleHelp, Dumbbell, Flame, Home, Lightbulb, Minus, Play, Plus, RotateCcw, Settings, Target, TriangleAlert, Wind, Wrench, X } from '@lucide/svelte';
  import { exerciseGuides, monthNumber, monthThemes, parseLocalDate, programEnd, schedule, workouts } from '$lib/program';
  import type { Session, SetLog, WorkoutType } from '$lib/types';

  let { data } = $props();

  function initialStartDate() {
    return data.startDate as string;
  }

  function initialSessions() {
    const result: Record<string, Session> = {};
    for (const row of data.sessions) {
      result[row.workout_date] = {
        date: row.workout_date,
        type: row.workout_type,
        completedAt: row.completed_at,
        durationMinutes: row.duration_minutes,
        cardioMinutes: row.cardio_minutes,
        notes: row.notes,
        logs: {}
      };
    }
    for (const log of data.logs) {
      const session = result[log.workout_date];
      if (!session) continue;
      session.logs[log.exercise_id] ??= [];
      session.logs[log.exercise_id].push({
        setNumber: log.set_number,
        reps: log.reps,
        weight: log.weight === null ? null : Number(log.weight),
        rir: log.rir,
        completed: log.completed
      });
    }
    return result;
  }

  let tab = $state<'home' | 'calendar' | 'progress'>('home');
  let startDate = $state(initialStartDate());
  let activeSession = $state<Session | null>(null);
  let saving = $state(false);
  let toast = $state('');
  let infoOpen = $state(false);
  let activeGuide = $state<{ type: WorkoutType; exerciseId: string; index: number } | null>(null);
  let sessions = $state<Record<string, Session>>(initialSessions());

  const today = new Date();
  const todayKey = localKey(today);
  let plan = $derived(schedule(startDate));
  let completedCount = $derived(Object.values(sessions).filter((session) => session.completedAt).length);
  let currentMonth = $derived(monthNumber(startDate, todayKey));
  let currentTheme = $derived(monthThemes[currentMonth - 1]);
  let nextWorkout = $derived(plan.find((item) => item.date >= todayKey && !sessions[item.date]?.completedAt) ?? plan.at(-1));
  let progressPercent = $derived(Math.min(100, Math.round((completedCount / Math.max(1, plan.filter((item) => item.date <= todayKey).length)) * 100)));

  function localKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function formatDate(value: string, long = false) {
    return new Intl.DateTimeFormat('it-IT', long
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : { weekday: 'short', day: 'numeric', month: 'short' }
    ).format(parseLocalDate(value));
  }

  function latestLogs(exerciseId: string, beforeDate: string) {
    return Object.values(sessions)
      .filter((session) => session.date < beforeDate && session.completedAt && session.logs[exerciseId]?.length)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.logs[exerciseId];
  }

  function suggestedWeight(type: WorkoutType, exerciseId: string, date: string) {
    const exercise = workouts[type].exercises.find((item) => item.id === exerciseId)!;
    const previous = latestLogs(exerciseId, date);
    if (!previous?.length) return exercise.startWeight;
    const weights = previous.map((set) => set.weight).filter((weight): weight is number => weight !== null);
    if (!weights.length) return exercise.startWeight;
    const weight = weights.at(-1)!;
    const reachedTop = exercise.maxReps && previous.length >= exercise.sets && previous.slice(0, exercise.sets).every((set) => set.completed && (set.reps ?? 0) >= exercise.maxReps!);
    return reachedTop && exercise.increment ? weight + exercise.increment : weight;
  }

  function openWorkout(date: string, type: WorkoutType) {
    const existing = sessions[date];
    const logs: Record<string, SetLog[]> = {};
    for (const exercise of workouts[type].exercises) {
      const saved = existing?.logs[exercise.id] ?? [];
      const weight = suggestedWeight(type, exercise.id, date);
      logs[exercise.id] = Array.from({ length: exercise.sets }, (_, index) => saved[index] ? { ...saved[index] } : {
        setNumber: index + 1, reps: null, weight, rir: null, completed: false
      });
    }
    activeSession = {
      date, type, logs,
      completedAt: existing?.completedAt ?? null,
      durationMinutes: existing?.durationMinutes ?? null,
      cardioMinutes: existing?.cardioMinutes ?? null,
      notes: existing?.notes ?? ''
    };
  }

  function adjust(set: SetLog, field: 'reps' | 'weight', amount: number) {
    const current = set[field] ?? 0;
    set[field] = Math.max(0, Math.round((current + amount) * 100) / 100);
  }

  async function saveSession(complete = false) {
    if (!activeSession) return;
    saving = true;
    const payload = { ...activeSession, completed: complete || Boolean(activeSession.completedAt) };
    const response = await fetch('/api/sessions', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
    });
    saving = false;
    if (!response.ok) {
      showToast('Salvataggio non riuscito');
      return;
    }
    if (complete) activeSession.completedAt = new Date().toISOString();
    sessions[activeSession.date] = structuredClone(activeSession);
    sessions = { ...sessions };
    showToast(complete ? 'Allenamento completato!' : 'Progressi salvati');
    if (complete) activeSession = null;
  }

  async function updateStartDate(value: string) {
    startDate = value;
    const response = await fetch('/api/settings', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ startDate: value })
    });
    showToast(response.ok ? 'Data di partenza aggiornata' : 'Aggiornamento non riuscito');
  }

  function showToast(message: string) {
    toast = message;
    setTimeout(() => { if (toast === message) toast = ''; }, 2600);
  }

  function weeklyStats() {
    const result: { label: string; done: number }[] = [];
    for (let offset = 7; offset >= 0; offset--) {
      const end = new Date(today);
      end.setDate(end.getDate() - offset * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const done = Object.values(sessions).filter((s) => s.completedAt && parseLocalDate(s.date) >= start && parseLocalDate(s.date) <= end).length;
      result.push({ label: String(end.getDate()), done });
    }
    return result;
  }
</script>

<svelte:head><title>GetFit · Allenati bene</title></svelte:head>

<div class="mx-auto min-h-screen max-w-lg pb-28">
  <header class="flex items-center justify-between px-5 pb-4 pt-6">
    <button class="flex items-center gap-2" onclick={() => tab = 'home'} aria-label="Vai alla home">
      <span class="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-lime"><Dumbbell size={21} strokeWidth={2.4} /></span>
      <span class="text-lg font-extrabold tracking-[-0.04em]">GetFit</span>
    </button>
    <button class="icon-button" onclick={() => infoOpen = true} aria-label="Apri impostazioni"><Settings size={19} /></button>
  </header>

  {#if tab === 'home'}
    <main class="space-y-5 px-5">
      <section class="pt-3">
        <p class="eyebrow">Il tuo percorso · mese {currentMonth} di 5</p>
        <h1 class="mt-2 max-w-sm text-[2.6rem] font-extrabold leading-[0.98] tracking-[-0.065em]">Costanza, non perfezione.</h1>
        <div class="mt-5 h-2 overflow-hidden rounded-full bg-black/[0.06]">
          <div class="h-full rounded-full bg-moss transition-all" style={`width: ${progressPercent}%`}></div>
        </div>
        <div class="mt-2 flex justify-between text-xs font-medium text-muted"><span>{completedCount} sedute completate</span><span>{progressPercent}%</span></div>
      </section>

      {#if nextWorkout}
        <section class="card overflow-hidden bg-ink text-white">
          <div class="p-6 pb-5">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.15em] text-lime">Prossima seduta</p>
                <p class="mt-2 capitalize text-sm text-white/60">{formatDate(nextWorkout.date, true)}</p>
              </div>
              <span class="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-xl font-extrabold">{nextWorkout.type}</span>
            </div>
            <h2 class="mt-8 text-3xl font-bold tracking-[-0.05em]">{workouts[nextWorkout.type].title}</h2>
            <p class="mt-1 text-sm text-white/60">{workouts[nextWorkout.type].focus}</p>
          </div>
          <button class="flex w-full items-center justify-center gap-2 bg-lime px-5 py-4 font-bold text-ink transition active:bg-lime/90" onclick={() => openWorkout(nextWorkout.date, nextWorkout.type)}>
            <Play size={18} fill="currentColor" /> Inizia allenamento
          </button>
        </section>
      {/if}

      <section class="grid grid-cols-2 gap-3">
        <div class="card p-5">
          <Flame class="text-moss" size={21} />
          <p class="mt-5 text-3xl font-extrabold tracking-[-0.05em]">{Object.values(sessions).filter((s) => s.completedAt && s.date >= localKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 21))).length}</p>
          <p class="mt-1 text-xs font-medium text-muted">sedute nelle ultime 3 settimane</p>
        </div>
        <div class="card p-5">
          <ChartNoAxesColumnIncreasing class="text-moss" size={21} />
          <p class="mt-5 text-3xl font-extrabold tracking-[-0.05em]">{currentTheme.title}</p>
          <p class="mt-1 text-xs font-medium text-muted">focus del mese {currentMonth}</p>
        </div>
      </section>

      <section class="card p-5">
        <div class="flex gap-4">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime/50"><CircleHelp size={19} /></span>
          <div><p class="font-bold">Regola di oggi</p><p class="mt-1 text-sm leading-6 text-muted">{currentTheme.text} Tecnica prima di ripetizioni e peso.</p></div>
        </div>
      </section>
    </main>
  {:else if tab === 'calendar'}
    <main class="px-5">
      <p class="eyebrow pt-3">Programma completo</p>
      <h1 class="mt-2 text-4xl font-extrabold tracking-[-0.06em]">Calendario</h1>
      <p class="mt-2 text-sm text-muted">Martedì A · Giovedì B · Sabato C</p>

      <div class="mt-7 space-y-3">
        {#each plan as item, index}
          {@const complete = Boolean(sessions[item.date]?.completedAt)}
          {@const past = item.date < todayKey}
          {@const month = monthNumber(startDate, item.date)}
          {#if index === 0 || monthNumber(startDate, plan[index - 1].date) !== month}
            <div class="flex items-center gap-3 pb-1 pt-5 first:pt-0">
              <p class="eyebrow">Mese {month} · {monthThemes[month - 1].title}</p><span class="h-px flex-1 bg-black/10"></span>
            </div>
          {/if}
          <button class="card flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.99] {past && !complete ? 'opacity-55' : ''}" onclick={() => openWorkout(item.date, item.type)}>
            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl {complete ? 'bg-moss text-white' : 'bg-cream'}">
              {#if complete}<Check size={20} />{:else}<span class="font-extrabold">{item.type}</span>{/if}
            </span>
            <span class="min-w-0 flex-1"><span class="block capitalize font-bold">{formatDate(item.date, true)}</span><span class="mt-0.5 block truncate text-xs text-muted">{workouts[item.type].focus}</span></span>
            <ChevronRight size={19} class="text-muted" />
          </button>
        {/each}
      </div>
    </main>
  {:else}
    <main class="px-5">
      <p class="eyebrow pt-3">Il lavoro fatto</p>
      <h1 class="mt-2 text-4xl font-extrabold tracking-[-0.06em]">Progressi</h1>

      <section class="card mt-7 p-6">
        <div class="flex items-end justify-between"><div><p class="eyebrow">Aderenza</p><p class="mt-2 text-4xl font-extrabold tracking-[-0.06em]">{progressPercent}%</p></div><p class="text-sm font-semibold text-muted">{completedCount} / {plan.filter((i) => i.date <= todayKey).length}</p></div>
        <div class="mt-8 flex h-28 items-end gap-2">
          {#each weeklyStats() as week}
            <div class="flex h-full flex-1 flex-col justify-end gap-2">
              <div class="min-h-1 rounded-full bg-lime" style={`height: ${Math.max(5, week.done / 3 * 100)}%`} title={`${week.done} sedute`}></div>
              <span class="text-center text-[0.6rem] text-muted">{week.label}</span>
            </div>
          {/each}
        </div>
        <p class="mt-3 text-xs text-muted">Sedute completate nelle ultime 8 settimane</p>
      </section>

      <section class="mt-7">
        <div class="flex items-center justify-between"><h2 class="text-xl font-bold tracking-[-0.03em]">Ultime sedute</h2><RotateCcw size={18} class="text-muted" /></div>
        <div class="mt-3 space-y-3">
          {#each Object.values(sessions).filter((s) => s.completedAt).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8) as session}
            <button class="card flex w-full items-center gap-4 p-4 text-left" onclick={() => openWorkout(session.date, session.type)}>
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-moss font-bold text-white">{session.type}</span>
              <span class="flex-1"><span class="block capitalize font-bold">{formatDate(session.date)}</span><span class="text-xs text-muted">{Object.values(session.logs).flat().filter((s) => s.completed).length} serie · {session.cardioMinutes ?? 0} min cardio</span></span>
              <ChevronRight size={18} class="text-muted" />
            </button>
          {:else}
            <div class="card p-8 text-center"><Dumbbell class="mx-auto text-muted" /><p class="mt-3 font-bold">Il primo allenamento ti aspetta</p><p class="mt-1 text-sm text-muted">I tuoi progressi compariranno qui.</p></div>
          {/each}
        </div>
      </section>
    </main>
  {/if}

  <nav class="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-[30rem] -translate-x-1/2 items-center justify-around rounded-[1.4rem] border border-black/[0.06] bg-white/95 p-2 shadow-card backdrop-blur">
    <button class="flex min-w-20 flex-col items-center gap-1 rounded-2xl py-2 text-[0.65rem] font-bold {tab === 'home' ? 'bg-ink text-white' : 'text-muted'}" onclick={() => tab = 'home'}><Home size={19} />Oggi</button>
    <button class="flex min-w-20 flex-col items-center gap-1 rounded-2xl py-2 text-[0.65rem] font-bold {tab === 'calendar' ? 'bg-ink text-white' : 'text-muted'}" onclick={() => tab = 'calendar'}><CalendarDays size={19} />Piano</button>
    <button class="flex min-w-20 flex-col items-center gap-1 rounded-2xl py-2 text-[0.65rem] font-bold {tab === 'progress' ? 'bg-ink text-white' : 'text-muted'}" onclick={() => tab = 'progress'}><ChartNoAxesColumnIncreasing size={19} />Progressi</button>
  </nav>
</div>

{#if activeSession}
  <div class="fixed inset-0 z-40 overflow-y-auto bg-cream">
    <div class="mx-auto min-h-screen max-w-lg pb-36">
      <header class="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.05] bg-cream/95 px-5 py-4 backdrop-blur">
        <button class="icon-button" onclick={() => activeSession = null} aria-label="Chiudi"><ChevronLeft size={21} /></button>
        <div class="text-center"><p class="eyebrow">Seduta {activeSession.type}</p><p class="text-sm font-bold capitalize">{formatDate(activeSession.date)}</p></div>
        <button class="text-sm font-bold text-moss disabled:opacity-50" disabled={saving} onclick={() => saveSession(false)}>{saving ? 'Salvo…' : 'Salva'}</button>
      </header>

      <main class="px-5 pt-6">
        <h1 class="text-4xl font-extrabold tracking-[-0.06em]">{workouts[activeSession.type].title}</h1>
        <p class="mt-2 text-sm text-muted">{workouts[activeSession.type].focus}</p>

        <div class="mt-7 space-y-4">
          {#each workouts[activeSession.type].exercises as exercise, exerciseIndex}
            <section class="card overflow-hidden">
              <div class="flex items-start justify-between gap-3 p-5 pb-3">
                <div><p class="eyebrow">{String(exerciseIndex + 1).padStart(2, '0')}</p><h2 class="mt-1 text-lg font-bold tracking-[-0.03em]">{exercise.name}</h2></div>
                <div class="flex shrink-0 items-center gap-2">
                  <button class="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-moss active:scale-95" onclick={() => activeGuide = { type: activeSession!.type, exerciseId: exercise.id, index: exerciseIndex }} aria-label={`Guida per ${exercise.name}`}><BookOpen size={14} /> Guida</button>
                  <span class="rounded-full bg-lime/50 px-3 py-1.5 text-xs font-bold">{exercise.sets} × {exercise.reps}</span>
                </div>
              </div>
              {#if exercise.note}<p class="px-5 pb-3 text-xs leading-5 text-muted">{exercise.note}</p>{/if}
              <div class="border-t border-black/[0.05] px-3 pb-3">
                <div class="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-2 py-3 text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted"><span>Set</span><span>Kg</span><span>Reps</span><span>RIR</span></div>
                {#each activeSession.logs[exercise.id] as set}
                  <div class="mb-2 grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 rounded-2xl p-1.5 {set.completed ? 'bg-lime/25' : 'bg-cream'}">
                    <button class="grid h-8 w-8 place-items-center rounded-full {set.completed ? 'bg-moss text-white' : 'bg-white text-muted'}" onclick={() => set.completed = !set.completed} aria-label={`Completa serie ${set.setNumber}`}>
                      {#if set.completed}<Check size={16} />{:else}<span class="text-xs font-bold">{set.setNumber}</span>{/if}
                    </button>
                    <div class="flex items-center justify-center gap-1">
                      <button class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjust(set, 'weight', exercise.unit.includes('mano') ? -1 : -2.5)} aria-label="Riduci peso"><Minus size={13} /></button>
                      <input class="min-w-0 w-full bg-transparent text-center text-sm font-bold outline-none" type="number" step="0.5" placeholder="—" bind:value={set.weight} aria-label="Peso" />
                      <button class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjust(set, 'weight', exercise.unit.includes('mano') ? 1 : 2.5)} aria-label="Aumenta peso"><Plus size={13} /></button>
                    </div>
                    <div class="flex items-center justify-center gap-1">
                      <button class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjust(set, 'reps', -1)} aria-label="Riduci ripetizioni"><Minus size={13} /></button>
                      <input class="min-w-0 w-full bg-transparent text-center text-sm font-bold outline-none" type="number" placeholder="—" bind:value={set.reps} aria-label="Ripetizioni" />
                      <button class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjust(set, 'reps', 1)} aria-label="Aumenta ripetizioni"><Plus size={13} /></button>
                    </div>
                    <input class="h-8 w-full rounded-xl bg-white text-center text-sm font-bold outline-none" type="number" min="0" max="10" placeholder="—" bind:value={set.rir} aria-label="Ripetizioni in riserva" />
                  </div>
                {/each}
              </div>
            </section>
          {/each}
        </div>

        <section class="card mt-4 p-5">
          <h2 class="font-bold">Chiusura seduta</h2>
          <p class="mt-1 text-xs text-muted">{workouts[activeSession.type].cardio}</p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <label class="rounded-2xl bg-cream p-3"><span class="eyebrow">Durata</span><span class="mt-1 flex items-center gap-1"><input class="w-full bg-transparent text-xl font-bold outline-none" type="number" placeholder="60" bind:value={activeSession.durationMinutes} /><span class="text-xs text-muted">min</span></span></label>
            <label class="rounded-2xl bg-cream p-3"><span class="eyebrow">Cardio</span><span class="mt-1 flex items-center gap-1"><input class="w-full bg-transparent text-xl font-bold outline-none" type="number" placeholder="20" bind:value={activeSession.cardioMinutes} /><span class="text-xs text-muted">min</span></span></label>
          </div>
          <textarea class="mt-3 min-h-24 w-full resize-none rounded-2xl bg-cream p-4 text-sm outline-none placeholder:text-muted/60" placeholder="Come ti sei sentito? Note sulla tecnica…" bind:value={activeSession.notes}></textarea>
        </section>
      </main>

      <div class="fixed bottom-0 left-0 right-0 z-20 border-t border-black/[0.05] bg-cream/95 p-4 backdrop-blur">
        <button class="mx-auto flex w-full max-w-[30rem] items-center justify-center gap-2 rounded-2xl bg-ink py-4 font-bold text-white shadow-card disabled:opacity-50" disabled={saving} onclick={() => saveSession(true)}><Check size={19} /> Completa allenamento</button>
      </div>
    </div>
  </div>
{/if}

{#if infoOpen}
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center" role="presentation" onclick={(e) => e.currentTarget === e.target && (infoOpen = false)}>
    <section class="card w-full max-w-md p-6">
      <div class="flex items-center justify-between"><div><p class="eyebrow">Impostazioni</p><h2 class="mt-1 text-2xl font-extrabold tracking-[-0.05em]">Il tuo programma</h2></div><button class="icon-button" onclick={() => infoOpen = false} aria-label="Chiudi"><X size={19} /></button></div>
      <label class="mt-6 block"><span class="text-sm font-bold">Data di partenza</span><input class="mt-2 w-full rounded-2xl border border-black/10 bg-cream p-4 font-semibold outline-none focus:border-moss" type="date" value={startDate} onchange={(e) => updateStartDate(e.currentTarget.value)} /></label>
      <div class="mt-5 rounded-2xl bg-lime/30 p-4 text-sm leading-6"><strong>Fine prevista:</strong> {new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(programEnd(startDate))}</div>
      <div class="mt-5 space-y-3 text-sm leading-6 text-muted"><p><strong class="text-ink">Niente massimali.</strong> Interrompi la serie se la tecnica peggiora.</p><p><strong class="text-ink">Progressione.</strong> Aumenta il peso solo dopo aver raggiunto il massimo delle ripetizioni in tutte le serie.</p><p><strong class="text-ink">Collo.</strong> Mese 1 solo isometrie; dal mese 2 banda leggerissima se tutto è tranquillo.</p></div>
    </section>
  </div>
{/if}

{#if activeGuide}
  {@const guideExercise = workouts[activeGuide.type].exercises[activeGuide.index]}
  {@const guide = exerciseGuides[activeGuide.exerciseId]}
  {@const panelCount = workouts[activeGuide.type].exercises.length}
  <div class="fixed inset-0 z-[55] overflow-y-auto bg-cream">
    <div class="mx-auto min-h-screen max-w-lg pb-10">
      <header class="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.05] bg-cream/95 px-5 py-4 backdrop-blur">
        <button class="icon-button" onclick={() => activeGuide = null} aria-label="Torna alla seduta"><ChevronLeft size={21} /></button>
        <p class="text-sm font-bold">Come si esegue</p>
        <span class="w-11"></span>
      </header>

      <main class="px-5 pt-5">
        <div class="overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-white shadow-card" style={`aspect-ratio: ${864 / (1821 / panelCount)}`}>
          <div class="relative h-full w-full overflow-hidden">
            <img
              class="absolute left-0 top-0 h-auto w-full max-w-none"
              style={`transform: translateY(-${activeGuide.index / panelCount * 100}%)`}
              src={`/guides/workout-${activeGuide.type.toLowerCase()}.webp`}
              alt={`Esecuzione illustrata di ${guideExercise.name}, posizione iniziale e finale`}
            />
          </div>
        </div>

        <p class="eyebrow mt-6">Seduta {activeGuide.type} · esercizio {activeGuide.index + 1}</p>
        <h1 class="mt-2 text-4xl font-extrabold tracking-[-0.06em]">{guideExercise.name}</h1>
        <p class="mt-2 text-sm font-semibold text-moss">{guideExercise.sets} serie · {guideExercise.reps}</p>

        <section class="card mt-6 p-5">
          <div class="flex gap-4">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime/50"><Wrench size={18} /></span>
            <div><p class="eyebrow">Cosa cercare</p><h2 class="mt-1 font-bold">Attrezzo</h2><p class="mt-2 text-sm leading-6 text-muted">{guide.equipment}</p></div>
          </div>
        </section>

        <section class="card mt-3 p-5">
          <div class="flex gap-4">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-lime"><Play size={17} fill="currentColor" /></span>
            <div class="min-w-0 flex-1">
              <p class="eyebrow">Preparazione</p>
              <p class="mt-2 text-sm leading-6 text-muted">{guide.setup}</p>
              <div class="mt-5 space-y-4">
                {#each guide.steps as step, index}
                  <div class="flex gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime text-xs font-extrabold">{index + 1}</span><p class="pt-0.5 text-sm leading-6">{step}</p></div>
                {/each}
              </div>
            </div>
          </div>
        </section>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <section class="card p-5"><Wind class="text-moss" size={20} /><p class="eyebrow mt-4">Respirazione</p><p class="mt-2 text-sm leading-6 text-muted">{guide.breathing}</p></section>
          <section class="card p-5"><Target class="text-moss" size={20} /><p class="eyebrow mt-4">Cosa sentire</p><p class="mt-2 text-sm leading-6 text-muted">{guide.feel}</p></section>
        </div>

        <section class="card mt-3 p-5">
          <div class="flex gap-4">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800"><TriangleAlert size={18} /></span>
            <div><p class="eyebrow">Occhio a questi</p><h2 class="mt-1 font-bold">Errori comuni</h2><ul class="mt-3 space-y-2 text-sm leading-6 text-muted">{#each guide.mistakes as mistake}<li class="flex gap-2"><X class="mt-1 shrink-0 text-amber-700" size={14} /><span>{mistake}</span></li>{/each}</ul></div>
          </div>
        </section>

        {#if guide.safety}
          <section class="mt-3 rounded-[1.75rem] bg-ink p-5 text-white">
            <p class="text-xs font-bold uppercase tracking-[0.15em] text-lime">Sicurezza</p><p class="mt-2 text-sm leading-6 text-white/75">{guide.safety}</p>
          </section>
        {/if}

        <section class="card mt-3 p-5">
          <div class="flex gap-4"><Lightbulb class="mt-0.5 shrink-0 text-moss" size={20} /><div><p class="eyebrow">Se non è disponibile</p><h2 class="mt-1 font-bold">Alternativa</h2><p class="mt-2 text-sm leading-6 text-muted">{guide.alternative}</p></div></div>
        </section>

        <button class="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 font-bold text-white" onclick={() => activeGuide = null}><ChevronLeft size={18} /> Torna all’allenamento</button>
        <p class="mx-auto mt-4 max-w-sm text-center text-[0.68rem] leading-5 text-muted">Le illustrazioni sono orientative: le macchine possono cambiare forma. Se hai dubbi sulla tecnica o dolore, chiedi a un trainer qualificato.</p>
      </main>
    </div>
  </div>
{/if}

{#if toast}
  <div class="fixed left-1/2 top-5 z-[60] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-card">{toast}</div>
{/if}
