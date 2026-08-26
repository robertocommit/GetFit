<script lang="ts">
  import { BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, Check, ChevronLeft, ChevronRight, CircleHelp, Dumbbell, Flame, Home, Lightbulb, Minus, Play, Plus, RotateCcw, Settings, Target, TriangleAlert, Wind, Wrench, X } from '@lucide/svelte';
  import { goto } from '$app/navigation';
  import { exerciseGuides, monthNumber, monthThemes, parseLocalDate, programEnd, schedule, workouts } from '$lib/program';
  import type { Exercise, Session, SetLog, WorkoutType } from '$lib/types';

  let { data, initialWorkoutDate = null } = $props<{ data: any; initialWorkoutDate?: string | null }>();

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
  let sessionStartedAt = $state<number | null>(null);
  let autoSaveStatus = $state<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingChanges = false;
  let savePromise: Promise<void> | null = null;
  let initialWorkoutOpened = false;
  let toast = $state('');
  let infoOpen = $state(false);
  let activeGuide = $state<{ type: WorkoutType; exerciseId: string; index: number } | null>(null);
  let sessions = $state<Record<string, Session>>(initialSessions());

  const today = new Date();
  const todayKey = localKey(today);
  let plan = $derived(schedule(startDate));
  let dueWorkouts = $derived(plan.filter((item) => item.date <= todayKey));
  let completedDueCount = $derived(dueWorkouts.filter((item) => sessions[item.date]?.completedAt).length);
  let currentMonth = $derived(monthNumber(startDate, todayKey));
  let currentTheme = $derived(monthThemes[currentMonth - 1]);
  let nextWorkout = $derived(plan.find((item) => item.date >= todayKey && !sessions[item.date]?.completedAt) ?? plan.at(-1));
  let progressPercent = $derived(Math.min(100, Math.round((completedDueCount / Math.max(1, dueWorkouts.length)) * 100)));
  let totalCompletedSets = $derived(Object.values(sessions).reduce((total, session) => total + Object.values(session.logs).flat().filter((set) => set.completed).length, 0));
  let totalCardioMinutes = $derived(Object.values(sessions).reduce((total, session) => total + (session.cardioMinutes ?? 0), 0));
  let totalTrainingMinutes = $derived(Object.values(sessions).reduce((total, session) => total + (session.durationMinutes ?? 0), 0));

  $effect(() => {
    if (!initialWorkoutDate || initialWorkoutOpened) return;
    const type = sessions[initialWorkoutDate]?.type ?? plan.find((item) => item.date === initialWorkoutDate)?.type;
    if (!type) return;
    initialWorkoutOpened = true;
    openWorkout(initialWorkoutDate, type, false);
  });

  $effect(() => {
    const persistBeforeRefresh = () => {
      if (!activeSession || (!pendingChanges && !saving)) return;
      const completed = sessionIsComplete(activeSession);
      void fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...structuredClone(activeSession), completed }),
        keepalive: true
      });
    };
    window.addEventListener('beforeunload', persistBeforeRefresh);
    return () => window.removeEventListener('beforeunload', persistBeforeRefresh);
  });

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

  function openWorkout(date: string, type: WorkoutType, updateUrl = true) {
    if (updateUrl) {
      void goto(`/sedute/${date}`);
      return;
    }
    const existing = sessions[date];
    const logs: Record<string, SetLog[]> = {};
    for (const exercise of workouts[type].exercises) {
      const saved = existing?.logs[exercise.id] ?? [];
      const previous = latestLogs(exercise.id, date) ?? [];
      const weight = suggestedWeight(type, exercise.id, date);
      const mode = exercise.tracking ?? 'strength';
      const defaultReps = mode === 'strength'
        ? (exercise.minReps ?? null)
        : mode === 'timed'
          ? Number(exercise.reps.match(/\d+/)?.[0] ?? 20)
          : mode === 'carry' ? 1 : null;
      logs[exercise.id] = Array.from({ length: exercise.sets }, (_, index) => saved[index] ? { ...saved[index] } : {
        setNumber: index + 1,
        reps: previous[index]?.reps ?? previous[0]?.reps ?? defaultReps,
        weight: mode === 'timed' || mode === 'mobility' ? null : (previous[index]?.weight ?? previous[0]?.weight ?? weight),
        rir: null,
        completed: false
      });
    }
    activeSession = {
      date, type, logs,
      completedAt: existing?.completedAt ?? null,
      durationMinutes: existing?.durationMinutes ?? null,
      cardioMinutes: existing?.cardioMinutes ?? null,
      notes: existing?.notes ?? ''
    };
    sessionStartedAt = existing?.completedAt ? null : Date.now();
    autoSaveStatus = 'idle';
  }

  function applyToAll(exerciseId: string, field: 'reps' | 'weight', value: number | null) {
    if (!activeSession) return;
    for (const set of activeSession.logs[exerciseId]) set[field] = value;
  }

  function adjustAll(exerciseId: string, field: 'reps' | 'weight', amount: number) {
    if (!activeSession) return;
    const current = activeSession.logs[exerciseId][0]?.[field] ?? 0;
    applyToAll(exerciseId, field, Math.max(0, Math.round((current + amount) * 100) / 100));
    queueAutoSave();
  }

  function inputForAll(exerciseId: string, field: 'reps' | 'weight', event: Event) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    applyToAll(exerciseId, field, raw === '' ? null : Number(raw));
    queueAutoSave();
  }

  function toggleAll(exerciseId: string) {
    if (!activeSession) return;
    const sets = activeSession.logs[exerciseId];
    const complete = !sets.every((set) => set.completed);
    for (const set of sets) set.completed = complete;
    queueAutoSave(0);
  }

  function toggleSet(set: SetLog) {
    set.completed = !set.completed;
    queueAutoSave(0);
  }

  function modeFor(exercise: Exercise) {
    return exercise.tracking ?? 'strength';
  }

  function queueAutoSave(delay = 550) {
    pendingChanges = true;
    autoSaveStatus = 'pending';
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => { void saveSession(); }, delay);
  }

  function sessionIsComplete(session: Session) {
    return workouts[session.type].exercises.every((exercise) => session.logs[exercise.id]?.length && session.logs[exercise.id].every((set) => set.completed));
  }

  async function saveSession() {
    if (!activeSession) return;
    if (saving) {
      pendingChanges = true;
      return savePromise ?? undefined;
    }

    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
    const completed = sessionIsComplete(activeSession);
    if (completed && activeSession.durationMinutes === null && sessionStartedAt !== null) {
      activeSession.durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartedAt) / 60000));
    }

    pendingChanges = false;
    saving = true;
    autoSaveStatus = 'saving';
    const sessionBeingSaved = activeSession;
    const payload = { ...structuredClone(sessionBeingSaved), completed };
    let saveSucceeded = false;

    savePromise = (async () => {
      try {
        const response = await fetch('/api/sessions', {
          method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Salvataggio non riuscito');
        const result = await response.json();
        sessionBeingSaved.completedAt = result.completedAt ?? null;
        sessions[sessionBeingSaved.date] = structuredClone(sessionBeingSaved);
        sessions = { ...sessions };
        autoSaveStatus = 'saved';
        saveSucceeded = true;
      } catch {
        pendingChanges = true;
        autoSaveStatus = 'error';
      } finally {
        saving = false;
      }
    })();

    await savePromise;
    savePromise = null;
    if (saveSucceeded && pendingChanges && activeSession === sessionBeingSaved) await saveSession();
  }

  async function closeWorkout() {
    if (saving && savePromise) await savePromise;
    if (pendingChanges || autoSaveStatus === 'pending') await saveSession();
    activeSession = null;
    await goto('/');
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
    const result: { label: string; done: number; planned: number }[] = [];
    for (let offset = 7; offset >= 0; offset--) {
      const end = new Date(today);
      end.setDate(end.getDate() - offset * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const done = Object.values(sessions).filter((s) => s.completedAt && parseLocalDate(s.date) >= start && parseLocalDate(s.date) <= end).length;
      const planned = plan.filter((item) => parseLocalDate(item.date) >= start && parseLocalDate(item.date) <= end && item.date <= todayKey).length;
      result.push({ label: new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(start), done, planned });
    }
    return result;
  }

  function sessionHasData(session: Session) {
    return Boolean(session.completedAt || session.durationMinutes || session.cardioMinutes || session.notes.trim() || Object.values(session.logs).flat().some((set) => set.completed));
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
        <div class="mt-2 flex justify-between text-xs font-medium text-muted"><span>{completedDueCount} su {dueWorkouts.length} sedute previste finora</span><span>{progressPercent}%</span></div>
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
        <div class="flex items-end justify-between gap-4"><div><p class="eyebrow">Sedute svolte</p><p class="mt-2 text-4xl font-extrabold tracking-[-0.06em]">{completedDueCount} <span class="text-xl text-muted">su {dueWorkouts.length}</span></p></div><p class="rounded-full bg-lime/40 px-3 py-1.5 text-sm font-bold">{progressPercent}%</p></div>
        <p class="mt-3 text-xs leading-5 text-muted">Percentuale delle sedute programmate fino a oggi che hai completato interamente.</p>
        <div class="mt-7 flex h-36 items-end gap-2">
          {#each weeklyStats() as week}
            <div class="flex h-full min-w-0 flex-1 flex-col justify-end gap-1.5">
              <span class="text-center text-[0.62rem] font-bold">{week.done}/{week.planned}</span>
              <div class="relative h-24 overflow-hidden rounded-full bg-black/[0.05]">
                <div class="absolute bottom-0 w-full rounded-full bg-moss transition-all" style={`height: ${week.planned ? Math.max(6, week.done / week.planned * 100) : 0}%`} title={`${week.done} sedute su ${week.planned}`}></div>
              </div>
              <span class="truncate text-center text-[0.55rem] text-muted">{week.label}</span>
            </div>
          {/each}
        </div>
        <p class="mt-3 text-xs text-muted">Completate / programmate nelle ultime 8 settimane</p>
      </section>

      <section class="mt-3 grid grid-cols-3 gap-2">
        <div class="card p-4"><p class="text-2xl font-extrabold tracking-[-0.05em]">{totalCompletedSets}</p><p class="mt-1 text-[0.65rem] leading-4 text-muted">serie completate</p></div>
        <div class="card p-4"><p class="text-2xl font-extrabold tracking-[-0.05em]">{totalTrainingMinutes}</p><p class="mt-1 text-[0.65rem] leading-4 text-muted">minuti totali</p></div>
        <div class="card p-4"><p class="text-2xl font-extrabold tracking-[-0.05em]">{totalCardioMinutes}</p><p class="mt-1 text-[0.65rem] leading-4 text-muted">minuti cardio</p></div>
      </section>

      <section class="mt-7">
        <div class="flex items-center justify-between"><h2 class="text-xl font-bold tracking-[-0.03em]">Ultime sedute</h2><RotateCcw size={18} class="text-muted" /></div>
        <div class="mt-3 space-y-3">
          {#each Object.values(sessions).filter(sessionHasData).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8) as session}
            <button class="card flex w-full items-center gap-4 p-4 text-left" onclick={() => openWorkout(session.date, session.type)}>
              <span class="grid h-11 w-11 place-items-center rounded-2xl {session.completedAt ? 'bg-moss text-white' : 'bg-lime/40 text-ink'} font-bold">{session.type}</span>
              <span class="min-w-0 flex-1"><span class="block capitalize font-bold">{formatDate(session.date)}</span><span class="mt-0.5 block truncate text-xs text-muted">{Object.values(session.logs).flat().filter((s) => s.completed).length} serie completate{session.durationMinutes ? ` · ${session.durationMinutes} min totali` : ''}{session.cardioMinutes ? ` · ${session.cardioMinutes} min cardio` : ''}</span><span class="mt-1 block text-[0.62rem] font-bold uppercase tracking-wider {session.completedAt ? 'text-moss' : 'text-muted'}">{session.completedAt ? 'Completata' : 'In corso'}</span></span>
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
    <div class="mx-auto min-h-screen max-w-lg pb-12">
      <header class="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.05] bg-cream/95 px-5 py-4 backdrop-blur">
        <button class="icon-button" onclick={closeWorkout} aria-label="Chiudi"><ChevronLeft size={21} /></button>
        <div class="text-center"><p class="eyebrow">Seduta {activeSession.type}</p><p class="text-sm font-bold capitalize">{formatDate(activeSession.date)}</p></div>
        <div class="w-16 text-right text-xs font-bold {autoSaveStatus === 'error' ? 'text-amber-700' : 'text-moss'}" aria-live="polite">
          {#if autoSaveStatus === 'saving'}Salvo…{:else if autoSaveStatus === 'pending'}Da salvare{:else if autoSaveStatus === 'error'}<button onclick={() => saveSession()}>Riprova</button>{:else if autoSaveStatus === 'saved'}<span class="inline-flex items-center gap-1"><Check size={13} /> Salvato</span>{:else}<span class="text-muted">Auto</span>{/if}
        </div>
      </header>

      <main class="px-5 pt-6">
        <h1 class="text-4xl font-extrabold tracking-[-0.06em]">{workouts[activeSession.type].title}</h1>
        <p class="mt-2 text-sm text-muted">{workouts[activeSession.type].focus}</p>

        <div class="mt-7 space-y-4">
          {#each workouts[activeSession.type].exercises as exercise, exerciseIndex}
            {@const exerciseMode = modeFor(exercise)}
            {@const exerciseLogs = activeSession.logs[exercise.id]}
            <section class="card overflow-hidden">
              <div class="flex items-start justify-between gap-3 p-5 pb-3">
                <div><p class="eyebrow">{String(exerciseIndex + 1).padStart(2, '0')}</p><h2 class="mt-1 text-lg font-bold tracking-[-0.03em]">{exercise.name}</h2></div>
                <div class="flex shrink-0 items-center gap-2">
                  <button class="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-moss active:scale-95" onclick={() => activeGuide = { type: activeSession!.type, exerciseId: exercise.id, index: exerciseIndex }} aria-label={`Guida per ${exercise.name}`}><BookOpen size={14} /> Guida</button>
                  <span class="rounded-full bg-lime/50 px-3 py-1.5 text-xs font-bold">{exercise.sets} × {exercise.reps}</span>
                </div>
              </div>
              {#if exercise.note}<p class="px-5 pb-3 text-xs leading-5 text-muted">{exercise.note}</p>{/if}
              <div class="border-t border-black/[0.05] p-4">
                {#if exerciseMode === 'strength'}
                  <p class="eyebrow mb-2">Uguale per tutte le serie</p>
                  <div class="grid grid-cols-2 gap-2">
                    <div class="rounded-2xl bg-cream p-2">
                      <span class="block text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted">Peso · {exercise.unit}</span>
                      <div class="mt-1 flex items-center gap-1">
                        <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjustAll(exercise.id, 'weight', exercise.unit.includes('mano') ? -1 : -2.5)} aria-label="Riduci peso per tutte le serie"><Minus size={13} /></button>
                        <input class="min-w-0 w-full bg-transparent text-center text-base font-bold outline-none" type="number" step="0.5" placeholder="—" value={exerciseLogs[0]?.weight ?? ''} oninput={(event) => inputForAll(exercise.id, 'weight', event)} aria-label="Peso per tutte le serie" />
                        <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjustAll(exercise.id, 'weight', exercise.unit.includes('mano') ? 1 : 2.5)} aria-label="Aumenta peso per tutte le serie"><Plus size={13} /></button>
                      </div>
                    </div>
                    <div class="rounded-2xl bg-cream p-2">
                      <span class="block text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted">Ripetizioni</span>
                      <div class="mt-1 flex items-center gap-1">
                        <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjustAll(exercise.id, 'reps', -1)} aria-label="Riduci ripetizioni per tutte le serie"><Minus size={13} /></button>
                        <input class="min-w-0 w-full bg-transparent text-center text-base font-bold outline-none" type="number" placeholder="—" value={exerciseLogs[0]?.reps ?? ''} oninput={(event) => inputForAll(exercise.id, 'reps', event)} aria-label="Ripetizioni per tutte le serie" />
                        <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjustAll(exercise.id, 'reps', 1)} aria-label="Aumenta ripetizioni per tutte le serie"><Plus size={13} /></button>
                      </div>
                    </div>
                  </div>
                {:else if exerciseMode === 'timed'}
                  <div class="rounded-2xl bg-cream p-2">
                    <span class="block text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted">Durata per ogni tenuta · secondi</span>
                    <div class="mx-auto mt-1 flex max-w-48 items-center gap-1">
                      <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjustAll(exercise.id, 'reps', -5)} aria-label="Riduci durata"><Minus size={13} /></button>
                      <input class="min-w-0 w-full bg-transparent text-center text-base font-bold outline-none" type="number" placeholder="20" value={exerciseLogs[0]?.reps ?? ''} oninput={(event) => inputForAll(exercise.id, 'reps', event)} aria-label="Secondi per ogni tenuta" />
                      <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white" onclick={() => adjustAll(exercise.id, 'reps', 5)} aria-label="Aumenta durata"><Plus size={13} /></button>
                    </div>
                  </div>
                {:else if exerciseMode === 'carry'}
                  <label class="block rounded-2xl bg-cream p-3">
                    <span class="block text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted">Carico facoltativo · {exercise.unit}</span>
                    <input class="mt-1 w-full bg-transparent text-center text-base font-bold outline-none" type="number" step="0.5" placeholder="Non indicato" value={exerciseLogs[0]?.weight ?? ''} oninput={(event) => inputForAll(exercise.id, 'weight', event)} aria-label="Carico farmer carry per tutti i giri" />
                  </label>
                {:else}
                  <p class="rounded-2xl bg-cream p-3 text-center text-sm text-muted">Nessun peso o numero di ripetizioni da inserire.</p>
                {/if}

                <div class="mt-3 grid grid-cols-2 gap-2">
                  {#each exerciseLogs as set}
                    <button class="flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 font-bold transition {set.completed ? 'bg-moss text-white' : 'bg-cream text-ink'}" onclick={() => toggleSet(set)} aria-label={`Completa ${exerciseMode === 'carry' ? 'giro' : 'serie'} ${set.setNumber}`}>
                      <span class="grid h-6 w-6 place-items-center rounded-full {set.completed ? 'bg-white/20' : 'bg-white'}">{#if set.completed}<Check size={14} />{:else}<span class="text-xs">{set.setNumber}</span>{/if}</span>
                      {exerciseMode === 'carry' ? 'Giro' : exerciseMode === 'mobility' ? 'Sequenza' : exerciseMode === 'timed' ? 'Tenuta' : 'Serie'} {set.setNumber}
                    </button>
                  {/each}
                </div>
                <button class="mt-2 w-full rounded-xl py-2 text-xs font-bold text-moss" onclick={() => toggleAll(exercise.id)}>{exerciseLogs.every((set) => set.completed) ? 'Deseleziona tutte' : 'Segna tutte come completate'}</button>
              </div>
            </section>
          {/each}
        </div>

        {#if sessionIsComplete(activeSession)}
          <section class="mt-4 rounded-[1.75rem] bg-moss p-5 text-white" aria-live="polite">
            <div class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-full bg-white/15"><Check size={20} /></span><div><h2 class="font-bold">Seduta completata</h2><p class="mt-1 text-xs text-white/75">Tutte le attività sono concluse. Il risultato viene salvato automaticamente.</p></div></div>
          </section>
        {/if}

        <section class="card mt-4 p-5">
          <h2 class="font-bold">Chiusura seduta</h2>
          <p class="mt-1 text-xs leading-5 text-muted">Tutto facoltativo. Il tempo totale viene calcolato automaticamente se lo lasci vuoto. {workouts[activeSession.type].cardio}</p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <label class="rounded-2xl bg-cream p-3"><span class="eyebrow">Tempo totale</span><span class="mt-1 flex items-center gap-1"><input class="w-full bg-transparent text-xl font-bold outline-none" type="number" placeholder="Auto" bind:value={activeSession.durationMinutes} oninput={() => queueAutoSave()} /><span class="text-xs text-muted">min</span></span><span class="mt-1 block text-[0.65rem] text-muted">Intera seduta</span></label>
            <label class="rounded-2xl bg-cream p-3"><span class="eyebrow">Cardio extra</span><span class="mt-1 flex items-center gap-1"><input class="w-full bg-transparent text-xl font-bold outline-none" type="number" placeholder="—" bind:value={activeSession.cardioMinutes} oninput={() => queueAutoSave()} /><span class="text-xs text-muted">min</span></span><span class="mt-1 block text-[0.65rem] text-muted">Solo se svolto</span></label>
          </div>
          <textarea class="mt-3 min-h-24 w-full resize-none rounded-2xl bg-cream p-4 text-sm outline-none placeholder:text-muted/60" placeholder="Come ti sei sentito? Note sulla tecnica…" bind:value={activeSession.notes} oninput={() => queueAutoSave()}></textarea>
        </section>
      </main>
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
