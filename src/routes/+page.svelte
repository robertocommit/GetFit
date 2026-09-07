<script lang="ts">
  import { BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Dumbbell, Footprints, History, Home, Lightbulb, LoaderCircle, LockKeyhole, Minus, Play, Plus, RotateCcw, Settings, Swords, Target, TriangleAlert, Wind, Wrench, X } from '@lucide/svelte';
  import { goto } from '$app/navigation';
  import { exerciseGuides, monthNumber, monthThemes, parseLocalDate, programEnd, schedule, workouts } from '$lib/program';
  import type { ActivityLog, ActivityType, Exercise, Session, SetLog, SkipReason, WorkoutType } from '$lib/types';

  let { data, initialWorkoutDate = null } = $props<{ data: any; initialWorkoutDate?: string | null }>();
  type ContributionStatus = 'outside' | 'rest' | 'completed' | 'partial' | 'missed' | 'skipped' | 'scheduled';
  type ContributionMarker = { label: string; name: string; status: 'completed' | 'missed' | 'skipped' | 'scheduled'; detail?: string };
  type ContributionDay = { date: string; status: ContributionStatus; markers: ContributionMarker[] };
  type WeekItem =
    | { kind: 'workout'; type: WorkoutType; label: string; completed: boolean; future: boolean; missed: boolean; skipped: boolean; skipReason: SkipReason | null }
    | { kind: 'activity'; type: ActivityType; label: string; completed: boolean; future: boolean; missed: boolean; skipped: boolean; skipReason: SkipReason | null };
  type WeekDay = { date: string; dayLabel: string; dateLabel: string; today: boolean; items: WeekItem[] };

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
        skippedReason: row.skipped_reason ?? null,
        skippedAt: row.skipped_at ?? null,
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
        effort: log.effort,
        completed: log.completed,
        skipped: Boolean(log.skipped)
      });
    }
    return result;
  }

  function initialActivities() {
    const result: Record<string, ActivityLog> = {};
    for (const row of data.activities ?? []) {
      const activity: ActivityLog = {
        date: row.activity_date,
        type: row.activity_type,
        completedAt: row.completed_at,
        skippedReason: row.skipped_reason ?? null,
        skippedAt: row.skipped_at ?? null,
        durationMinutes: row.duration_minutes,
        distanceKm: row.distance_km === null ? null : Number(row.distance_km),
        rpe: row.rpe,
        sprintCompleted: row.sprint_completed,
        notes: row.notes
      };
      result[activityKey(activity.date, activity.type)] = activity;
    }
    return result;
  }

  let tab = $state<'home' | 'calendar' | 'progress'>('home');
  let startDate = $state(initialStartDate());
  let activeSession = $state<Session | null>(null);
  let saving = $state(false);
  let finishing = $state(false);
  let workoutSkipping = $state(false);

  function skipReasonLabel(reason: SkipReason | null | undefined) {
    return reason === 'forza_maggiore' ? 'Causa maggiore' : reason === 'pigrizia' ? 'Pigrizia' : '';
  }
  let sessionStartedAt = $state<number | null>(null);
  let elapsedSeconds = $state(0);
  let autoSaveStatus = $state<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryAttempts = 0;
  let pendingChanges = false;
  let savePromise: Promise<void> | null = null;
  let initialWorkoutOpened = false;
  let toast = $state('');
  let infoOpen = $state(false);
  let activeGuide = $state<{ type: WorkoutType; exerciseId: string; index: number } | null>(null);
  let historyExercise = $state<{ exercise: Exercise; beforeDate: string } | null>(null);
  let sessions = $state<Record<string, Session>>(initialSessions());
  let activities = $state<Record<string, ActivityLog>>(initialActivities());
  let activeActivity = $state<ActivityLog | null>(null);
  let activitySaving = $state(false);

  const today = new Date();
  const todayKey = localKey(today);
  let plan = $derived(schedule(startDate));
  let dueWorkouts = $derived(plan.filter((item) => item.date <= todayKey));
  let completedDueCount = $derived(dueWorkouts.filter((item) => sessions[item.date]?.completedAt).length);
  let skippedDueCount = $derived(dueWorkouts.filter((item) => !sessions[item.date]?.completedAt && sessions[item.date]?.skippedReason).length);
  let skippedDueForza = $derived(dueWorkouts.filter((item) => sessions[item.date]?.skippedReason === 'forza_maggiore').length);
  let skippedDuePigrizia = $derived(dueWorkouts.filter((item) => sessions[item.date]?.skippedReason === 'pigrizia').length);
  let skippedActivitiesCount = $derived(Object.values(activities).filter((activity) => activity.skippedReason && !activity.completedAt && activity.date >= activityTrackingStart() && activity.date <= todayKey).length);
  let currentMonth = $derived(monthNumber(startDate, todayKey));
  let progressPercent = $derived(Math.min(100, Math.round((completedDueCount / Math.max(1, dueWorkouts.length)) * 100)));
  let completedProgramSessions = $derived(Object.values(sessions).filter((session) => session.completedAt && session.date >= startDate && session.date <= todayKey));
  let totalCompletedSets = $derived(completedProgramSessions.reduce((total, session) => total + Object.values(session.logs).flat().filter((set) => set.completed).length, 0));
  let totalCardioMinutes = $derived(completedProgramSessions.reduce((total, session) => total + (session.cardioMinutes ?? 0), 0));
  let totalTrainingMinutes = $derived(completedProgramSessions.reduce((total, session) => total + (session.durationMinutes ?? 0), 0));
  let completedActivities = $derived(Object.values(activities).filter((activity) => activity.completedAt && activity.date >= activityTrackingStart() && activity.date <= todayKey));
  let completedRuns = $derived(completedActivities.filter((activity) => activity.type === 'run'));
  let completedWingChun = $derived(completedActivities.filter((activity) => activity.type === 'wing_chun').length);
  let totalRunDistance = $derived(Math.round(completedRuns.reduce((total, activity) => total + (activity.distanceKm ?? 0), 0) * 10) / 10);
  let weekDays = $derived(currentWeekDays());
  let weekItems = $derived(weekDays.flatMap((day) => day.items));
  let weekCompletedCount = $derived(weekItems.filter((item) => item.completed).length);
  let weekPlannedCount = $derived(weekItems.length);
  let weekProgress = $derived(Math.round((weekCompletedCount / Math.max(1, weekPlannedCount)) * 100));

  $effect(() => {
    if (!initialWorkoutDate || initialWorkoutOpened) return;
    const type = sessions[initialWorkoutDate]?.type ?? plan.find((item) => item.date === initialWorkoutDate)?.type;
    if (!type) return;
    initialWorkoutOpened = true;
    openWorkout(initialWorkoutDate, type, false);
  });

  $effect(() => {
    const persistBeforeRefresh = () => {
      if (!activeSession || activeSession.completedAt || (!pendingChanges && !saving)) return;
      persistDraft(activeSession);
      void fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...cloneSession(activeSession), completed: false }),
        keepalive: true
      });
    };
    window.addEventListener('beforeunload', persistBeforeRefresh);
    return () => window.removeEventListener('beforeunload', persistBeforeRefresh);
  });

  $effect(() => {
    if (!activeSession || sessionStartedAt === null || sessionIsComplete(activeSession)) return;
    const updateElapsed = () => { elapsedSeconds = Math.max(0, Math.floor((Date.now() - sessionStartedAt!) / 1000)); };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  });

  function localKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function activityKey(date: string, type: ActivityType) {
    return `${date}:${type}`;
  }

  function activityName(type: ActivityType) {
    return type === 'run' ? 'Corsa' : 'Wing Chun';
  }

  function activityTrackingStart() {
    const start = parseLocalDate(startDate);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return localKey(start);
  }

  function wingChunStartDate() {
    const start = parseLocalDate(activityTrackingStart());
    start.setDate(start.getDate() + 7);
    return localKey(start);
  }

  function supplementalTypesForDate(date: string): ActivityType[] {
    const parsed = parseLocalDate(date);
    const trackingStart = parseLocalDate(activityTrackingStart());
    const wingChunStart = parseLocalDate(wingChunStartDate());
    if (parsed < trackingStart || parsed >= programEnd(startDate)) return [];
    const day = parsed.getDay();
    const result: ActivityType[] = [];
    if ([1, 3, 5].includes(day)) result.push('run');
    if (parsed >= wingChunStart && [1, 3].includes(day)) result.push('wing_chun');
    return result;
  }

  function currentWeekDays(): WeekDay[] {
    const monday = new Date(today);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, offset) => {
      const day = new Date(monday);
      day.setDate(day.getDate() + offset);
      const date = localKey(day);
      const future = date > todayKey;
      const workout = plan.find((item) => item.date === date);
      const items: WeekItem[] = [];
      if (workout) {
        const completed = Boolean(sessions[date]?.completedAt);
        const skipped = !completed && Boolean(sessions[date]?.skippedReason);
        items.push({ kind: 'workout', type: workout.type, label: `Palestra ${workout.type}`, completed, future, missed: !completed && !skipped && date < todayKey, skipped, skipReason: sessions[date]?.skippedReason ?? null });
      }
      for (const type of supplementalTypesForDate(date)) {
        const completed = Boolean(activities[activityKey(date, type)]?.completedAt);
        const skipped = !completed && Boolean(activities[activityKey(date, type)]?.skippedReason);
        items.push({ kind: 'activity', type, label: activityName(type), completed, future, missed: !completed && !skipped && date < todayKey, skipped, skipReason: activities[activityKey(date, type)]?.skippedReason ?? null });
      }
      return {
        date,
        dayLabel: new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(day).replace('.', ''),
        dateLabel: new Intl.DateTimeFormat('it-IT', { day: 'numeric' }).format(day),
        today: date === todayKey,
        items
      };
    });
  }

  function weekRangeLabel() {
    if (!weekDays.length) return '';
    const first = parseLocalDate(weekDays[0].date);
    const last = parseLocalDate(weekDays.at(-1)!.date);
    const firstLabel = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: first.getMonth() === last.getMonth() ? undefined : 'short' }).format(first);
    const lastLabel = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(last);
    return `${firstLabel} – ${lastLabel}`;
  }

  function weekItemStatus(item: WeekItem, day: WeekDay) {
    if (item.completed) return 'Completata';
    if (item.skipped) return `Saltata · ${skipReasonLabel(item.skipReason)}`;
    if (item.missed) return 'Da recuperare';
    if (day.today) return 'Oggi';
    return 'Prevista';
  }

  function openWeekItem(day: WeekDay, item: WeekItem) {
    if (item.kind === 'workout') {
      openWorkout(day.date, item.type);
      return;
    }
    if (item.future || activitySaving) return;
    openActivity(day.date, item.type);
  }

  function newActivity(date: string, type: ActivityType): ActivityLog {
    return {
      date,
      type,
      completedAt: null,
      skippedReason: null,
      skippedAt: null,
      durationMinutes: null,
      distanceKm: type === 'run' ? 1.3 : null,
      rpe: null,
      sprintCompleted: false,
      notes: ''
    };
  }

  function openActivity(date: string, type: ActivityType) {
    activeActivity = { ...(activities[activityKey(date, type)] ?? newActivity(date, type)) };
  }

  async function persistActivity(activity: ActivityLog) {
    activitySaving = true;
    try {
      const response = await fetch('/api/activities', {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(activity)
      });
      if (!response.ok) throw new Error('Salvataggio non riuscito');
      const result = await response.json();
      const saved = { ...activity, completedAt: result.completedAt ?? null, skippedReason: result.skippedReason ?? null, skippedAt: result.skippedAt ?? null };
      activities[activityKey(saved.date, saved.type)] = saved;
      activities = { ...activities };
      return true;
    } catch {
      showToast('Attività non salvata');
      return false;
    } finally {
      activitySaving = false;
    }
  }

  async function saveActiveActivity() {
    if (!activeActivity || activitySaving) return;
    activeActivity.skippedReason = null;
    activeActivity.skippedAt = null;
    if (await persistActivity(activeActivity)) {
      activeActivity = null;
      showToast('Attività aggiornata');
    }
  }

  async function skipActiveActivity(reason: SkipReason) {
    if (!activeActivity || activitySaving || activeActivity.completedAt) return;
    activitySaving = true;
    try {
      const response = await fetch('/api/activities', {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: activeActivity.date, type: activeActivity.type, notes: activeActivity.notes, skippedReason: reason })
      });
      if (!response.ok) throw new Error('Salvataggio non riuscito');
      const result = await response.json();
      activeActivity = { ...activeActivity, completedAt: null, skippedReason: result.skippedReason ?? reason, skippedAt: result.skippedAt ?? null };
      activities[activityKey(activeActivity.date, activeActivity.type)] = { ...activeActivity };
      activities = { ...activities };
      showToast(`Attività saltata · ${skipReasonLabel(reason)}`);
    } catch {
      showToast('Attività non salvata');
    } finally {
      activitySaving = false;
    }
  }

  async function removeActiveActivity() {
    if (!activeActivity || activitySaving || (!activeActivity.completedAt && !activeActivity.skippedReason)) return;
    const wasSkipped = !activeActivity.completedAt && Boolean(activeActivity.skippedReason);
    activitySaving = true;
    try {
      const response = await fetch('/api/activities', {
        method: 'DELETE', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: activeActivity.date, type: activeActivity.type })
      });
      if (!response.ok) throw new Error('Rimozione non riuscita');
      delete activities[activityKey(activeActivity.date, activeActivity.type)];
      activities = { ...activities };
      activeActivity = null;
      showToast(wasSkipped ? 'Rimessa in programma' : 'Registrazione rimossa');
    } catch {
      showToast('Impossibile rimuovere l’attività');
    } finally {
      activitySaving = false;
    }
  }

  function formatDate(value: string, long = false) {
    return new Intl.DateTimeFormat('it-IT', long
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : { weekday: 'short', day: 'numeric', month: 'short' }
    ).format(parseLocalDate(value));
  }

  function draftKey(date: string) {
    return `getfit-session-draft:${date}`;
  }

  function startKey(date: string) {
    return `getfit-session-start:${date}`;
  }

  function readSessionStart(date: string) {
    try {
      const value = Number(localStorage.getItem(startKey(date)));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  function clearSessionStart(date: string) {
    try {
      localStorage.removeItem(startKey(date));
    } catch {
      // Nessuna azione necessaria.
    }
  }

  function formatElapsed(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  function persistDraft(session: Session) {
    try {
      localStorage.setItem(draftKey(session.date), JSON.stringify(session));
    } catch {
      // Il salvataggio sul server continua anche se lo storage locale non è disponibile.
    }
  }

  function cloneSession(session: Session): Session {
    return JSON.parse(JSON.stringify(session)) as Session;
  }

  function readDraft(date: string, type: WorkoutType) {
    try {
      const raw = localStorage.getItem(draftKey(date));
      if (!raw) return null;
      const draft = JSON.parse(raw) as Session;
      return draft.date === date && draft.type === type && draft.logs ? draft : null;
    } catch {
      return null;
    }
  }

  function clearDraft(date: string) {
    try {
      localStorage.removeItem(draftKey(date));
    } catch {
      // Nessuna azione necessaria.
    }
  }

  function latestLogs(exerciseId: string, beforeDate: string, type?: WorkoutType) {
    return Object.values(sessions)
      .filter((session) => session.date < beforeDate && session.completedAt && (!type || session.type === type) && session.logs[exerciseId]?.some((set) => set.completed))
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.logs[exerciseId];
  }

  function suggestedWeight(type: WorkoutType, exerciseId: string, date: string) {
    const exercise = workouts[type].exercises.find((item) => item.id === exerciseId)!;
    const previous = latestLogs(exerciseId, date, type);
    if (!previous?.length) return exercise.startWeight;
    const weights = previous.map((set) => set.weight).filter((weight): weight is number => weight !== null);
    if (!weights.length) return exercise.startWeight;
    return weights.at(-1)!;
  }

  function suggestedReps(exercise: Exercise, previous: SetLog[], index: number) {
    const fallback = exercise.minReps ?? null;
    const current = previous[index]?.reps ?? previous[0]?.reps ?? fallback;
    if (current === null) return null;
    const previousExerciseComplete = previous.length >= exercise.sets
      && previous.slice(0, exercise.sets).every((set) => set.completed);
    if (!previousExerciseComplete) return current;
    const recordedEffort = previous.slice(0, exercise.sets).map((set) => set.effort).filter((value): value is number => value !== null);
    if (recordedEffort.length && Math.max(...recordedEffort) >= 3) return current;
    return Math.min(current + 1, exercise.maxReps ?? current + 1);
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
      const previous = latestLogs(exercise.id, date, type) ?? [];
      const weight = suggestedWeight(type, exercise.id, date);
      const mode = exercise.tracking ?? 'strength';
      const defaultReps = mode === 'strength'
        ? (exercise.minReps ?? null)
        : mode === 'timed'
          ? Number(exercise.reps.match(/\d+/)?.[0] ?? 20)
          : mode === 'carry' ? 1 : null;
      logs[exercise.id] = Array.from({ length: exercise.sets }, (_, index) => saved[index] ? { ...saved[index] } : {
        setNumber: index + 1,
        reps: mode === 'strength' ? suggestedReps(exercise, previous, index) : (previous[index]?.reps ?? previous[0]?.reps ?? defaultReps),
        weight: mode === 'timed' || mode === 'mobility' ? null : weight,
        effort: null,
        completed: false,
        skipped: false
      });
    }
    const serverSession: Session = {
      date, type, logs,
      completedAt: existing?.completedAt ?? null,
      skippedReason: existing?.skippedReason ?? null,
      skippedAt: existing?.skippedAt ?? null,
      durationMinutes: existing?.durationMinutes ?? null,
      cardioMinutes: existing?.cardioMinutes ?? null,
      notes: existing?.notes ?? ''
    };
    if (existing?.completedAt) clearDraft(date);
    const draft = existing?.completedAt ? null : readDraft(date, type);
    activeSession = draft ? {
      ...serverSession,
      ...draft,
      logs: { ...serverSession.logs, ...draft.logs }
    } : serverSession;
    sessionStartedAt = existing?.completedAt ? null : readSessionStart(date);
    elapsedSeconds = sessionStartedAt === null ? 0 : Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
    autoSaveStatus = draft ? 'pending' : 'idle';
    if (draft) queueAutoSave(0);
  }

  function startWorkout() {
    if (!activeSession || sessionStartedAt !== null || activeSession.skippedReason) return;
    sessionStartedAt = Date.now();
    elapsedSeconds = 0;
    try {
      localStorage.setItem(startKey(activeSession.date), String(sessionStartedAt));
    } catch {
      // Il timer continua anche se lo storage locale non è disponibile.
    }
  }

  function applyToAll(exerciseId: string, field: 'reps' | 'weight' | 'effort', value: number | null) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    for (const set of activeSession.logs[exerciseId]) set[field] = value;
  }

  function setUnitLabel(exercise: Exercise) {
    const mode = exercise.tracking ?? 'strength';
    return mode === 'carry' ? 'giro' : mode === 'timed' ? 'tenuta' : mode === 'mobility' ? 'sequenza' : 'serie';
  }

  function addSet(exerciseId: string) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    const logs = activeSession.logs[exerciseId];
    if (!logs) return;
    const template = logs.at(-1) ?? logs[0];
    logs.push({
      setNumber: logs.length + 1,
      reps: template?.reps ?? null,
      weight: template?.weight ?? null,
      effort: null,
      completed: false,
      skipped: false
    });
    queueAutoSave();
  }

  function removeAddedSet(exerciseId: string, plannedSets: number) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    const logs = activeSession.logs[exerciseId];
    if (!logs || logs.length <= plannedSets) return;
    logs.pop();
    queueAutoSave();
  }

  async function skipActiveWorkout(reason: SkipReason) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason || workoutSkipping) return;
    workoutSkipping = true;
    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...cloneSession(activeSession), completed: false, skippedReason: reason })
      });
      if (!response.ok) throw new Error('Salvataggio non riuscito');
      const result = await response.json();
      activeSession.skippedReason = result.skippedReason ?? reason;
      activeSession.skippedAt = result.skippedAt ?? null;
      activeSession.completedAt = null;
      clearDraft(activeSession.date);
      sessions[activeSession.date] = cloneSession(activeSession);
      sessions = { ...sessions };
      showToast(`Seduta saltata · ${skipReasonLabel(reason)}`);
    } catch {
      showToast('Salvataggio non riuscito');
    } finally {
      workoutSkipping = false;
    }
  }

  async function unskipActiveWorkout() {
    if (!activeSession || activeSession.completedAt || !activeSession.skippedReason || workoutSkipping) return;
    workoutSkipping = true;
    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...cloneSession(activeSession), completed: false, skippedReason: null })
      });
      if (!response.ok) throw new Error('Salvataggio non riuscito');
      activeSession.skippedReason = null;
      activeSession.skippedAt = null;
      sessions[activeSession.date] = cloneSession(activeSession);
      sessions = { ...sessions };
      queueAutoSave(0);
      showToast('Seduta rimessa da fare');
    } catch {
      showToast('Salvataggio non riuscito');
    } finally {
      workoutSkipping = false;
    }
  }

  function adjustAll(exerciseId: string, field: 'reps' | 'weight', amount: number) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    const current = activeSession.logs[exerciseId][0]?.[field] ?? 0;
    applyToAll(exerciseId, field, Math.max(0, Math.round((current + amount) * 100) / 100));
    queueAutoSave();
  }

  function inputForAll(exerciseId: string, field: 'reps' | 'weight', event: Event) {
    const raw = (event.currentTarget as HTMLInputElement).value;
    applyToAll(exerciseId, field, raw === '' ? null : Number(raw));
    queueAutoSave();
  }

  function inputEffortForAll(exerciseId: string, event: Event) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    const value = Math.max(1, Math.min(4, Number((event.currentTarget as HTMLInputElement).value)));
    applyToAll(exerciseId, 'effort', value);
    queueAutoSave();
  }

  const effortLevels = {
    1: { label: 'Leggero', detail: 'Poco sforzo', color: '#315B47' },
    2: { label: 'Giusto', detail: 'Impegnativo ma fluido', color: '#7FA53A' },
    3: { label: 'Duro', detail: 'Fatica evidente', color: '#D38A24' },
    4: { label: 'Al limite', detail: 'Fatica estrema', color: '#C84B31' }
  } as const;

  function effortLevel(value: number | null) {
    return value && value in effortLevels ? effortLevels[value as keyof typeof effortLevels] : null;
  }

  function effortTrackStyle(value: number | null) {
    const level = effortLevel(value);
    const percentage = value === null ? 0 : ((value - 1) / 3) * 100;
    const color = level?.color ?? '#DDE2DC';
    return `background: linear-gradient(90deg, ${color} 0%, ${color} ${percentage}%, #DDE2DC ${percentage}%, #DDE2DC 100%)`;
  }

  function inputActivityEffort(event: Event) {
    if (!activeActivity) return;
    activeActivity.rpe = Math.max(1, Math.min(4, Number((event.currentTarget as HTMLInputElement).value)));
  }

  function updateSessionNumber(field: 'durationMinutes' | 'cardioMinutes', event: Event) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    const raw = (event.currentTarget as HTMLInputElement).value;
    activeSession[field] = raw === '' ? null : Number(raw);
    queueAutoSave();
  }

  function updateSessionNotes(event: Event) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    activeSession.notes = (event.currentTarget as HTMLTextAreaElement).value;
    queueAutoSave();
  }

  function toggleSet(set: SetLog) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason || set.skipped) return;
    set.completed = !set.completed;
    queueAutoSave(0);
  }

  function toggleExerciseSkipped(exerciseId: string) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    const logs = activeSession.logs[exerciseId];
    const skipped = !logs.every((set) => set.skipped);
    for (const set of logs) {
      set.skipped = skipped;
      if (skipped) {
        set.completed = false;
        set.effort = null;
      }
    }
    queueAutoSave(0);
  }

  function modeFor(exercise: Exercise) {
    return exercise.tracking ?? 'strength';
  }

  function queueAutoSave(delay = 550) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    pendingChanges = true;
    autoSaveStatus = 'pending';
    if (!sessionIsComplete(activeSession)) activeSession.completedAt = null;
    persistDraft(activeSession);
    sessions[activeSession.date] = cloneSession(activeSession);
    sessions = { ...sessions };
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    if (retryTimer) clearTimeout(retryTimer);
    autoSaveTimer = setTimeout(() => { void saveSession(); }, delay);
  }

  function sessionIsComplete(session: Session) {
    return workouts[session.type].exercises.every((exercise) => session.logs[exercise.id]?.length && session.logs[exercise.id].every((set) => set.completed || set.skipped));
  }

  async function saveSession(completeSession = false) {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason) return;
    if (saving) {
      pendingChanges = true;
      return savePromise ?? undefined;
    }

    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    const completed = completeSession && sessionIsComplete(activeSession);
    if (completed && sessionStartedAt !== null && activeSession.durationMinutes === null) {
      activeSession.durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      persistDraft(activeSession);
    }

    pendingChanges = false;
    saving = true;
    autoSaveStatus = 'saving';
    const sessionBeingSaved = activeSession;
    const payload = { ...cloneSession(sessionBeingSaved), completed };
    let saveSucceeded = false;

    savePromise = (async () => {
      try {
        const response = await fetch('/api/sessions', {
          method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Salvataggio non riuscito');
        const result = await response.json();
        sessionBeingSaved.completedAt = result.completedAt ?? null;
        sessions[sessionBeingSaved.date] = cloneSession(sessionBeingSaved);
        sessions = { ...sessions };
        if (!pendingChanges) clearDraft(sessionBeingSaved.date);
        if (result.completedAt && sessionIsComplete(sessionBeingSaved)) {
          clearSessionStart(sessionBeingSaved.date);
          sessionStartedAt = null;
        }
        autoSaveStatus = 'saved';
        retryAttempts = 0;
        saveSucceeded = true;
      } catch {
        pendingChanges = true;
        autoSaveStatus = 'error';
        retryAttempts += 1;
        const retryDelay = Math.min(30000, 2000 * 2 ** Math.min(retryAttempts - 1, 4));
        retryTimer = setTimeout(() => {
          if (activeSession === sessionBeingSaved && pendingChanges) void saveSession(completeSession);
        }, retryDelay);
      } finally {
        saving = false;
      }
    })();

    await savePromise;
    savePromise = null;
    if (saveSucceeded && pendingChanges && activeSession === sessionBeingSaved) await saveSession(completeSession);
  }

  async function finishWorkout() {
    if (!activeSession || activeSession.completedAt || activeSession.skippedReason || !sessionIsComplete(activeSession) || finishing) return;
    finishing = true;
    if (saving && savePromise) await savePromise;
    await saveSession(true);
    finishing = false;
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

  function contributionWeeks() {
    const result: {
      label: string;
      done: number;
      planned: number;
      days: ContributionDay[];
    }[] = [];
    const programStart = parseLocalDate(activityTrackingStart());
    programStart.setHours(0, 0, 0, 0);
    if (programStart > today) return result;

    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(currentWeekStart.getDate() - ((currentWeekStart.getDay() + 6) % 7));
    currentWeekStart.setHours(0, 0, 0, 0);
    const eightWeekWindow = new Date(currentWeekStart);
    eightWeekWindow.setDate(eightWeekWindow.getDate() - 7 * 7);
    let start = new Date(programStart > eightWeekWindow ? programStart : eightWeekWindow);

    while (start <= today) {
      const end = new Date(start);
      end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
      end.setHours(23, 59, 59, 999);
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      const days: ContributionDay[] = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + index);
        const date = localKey(day);
        const workout = plan.find((item) => item.date === date);
        const markerStatus = (completed: boolean, skipped: boolean): 'completed' | 'missed' | 'skipped' | 'scheduled' => completed ? 'completed' : skipped ? 'skipped' : date < todayKey ? 'missed' : 'scheduled';
        const markers: ContributionMarker[] = [];
        if (workout) {
          const skippedReason = sessions[date]?.skippedReason ?? null;
          markers.push({ label: workout.type, name: `Palestra ${workout.type}`, status: markerStatus(Boolean(sessions[date]?.completedAt), Boolean(skippedReason)), detail: skippedReason ? skipReasonLabel(skippedReason) : undefined });
        }
        for (const type of supplementalTypesForDate(date)) {
          const skippedReason = activities[activityKey(date, type)]?.skippedReason ?? null;
          markers.push({
            label: type === 'run' ? 'R' : 'W',
            name: activityName(type),
            status: markerStatus(Boolean(activities[activityKey(date, type)]?.completedAt), Boolean(skippedReason)),
            detail: skippedReason ? skipReasonLabel(skippedReason) : undefined
          });
        }
        const completedCount = markers.filter((marker) => marker.status === 'completed').length;
        const skippedCount = markers.filter((marker) => marker.status === 'skipped').length;
        const status: ContributionStatus = date < activityTrackingStart()
          ? 'outside'
          : !markers.length
            ? 'rest'
            : markers.every((marker) => marker.status === 'completed')
              ? 'completed'
              : markers.every((marker) => marker.status === 'completed' || marker.status === 'skipped')
                ? completedCount > 0 ? 'partial' : 'skipped'
                : completedCount > 0 || skippedCount > 0
                  ? 'partial'
                  : markers.some((marker) => marker.status === 'missed') ? 'missed' : 'scheduled';
        return { date, status, markers };
      });
      const dueMarkers = days.flatMap((day) => day.date <= todayKey ? day.markers : []);
      const done = dueMarkers.filter((marker) => marker.status === 'completed').length;
      const planned = dueMarkers.length;
      result.push({ label: new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(start), done, planned, days });
      start = new Date(end);
      start.setMilliseconds(start.getMilliseconds() + 1);
    }
    return result;
  }

  function contributionTitle(day: ContributionDay) {
    const details = day.markers.map((marker) => `${marker.name}: ${marker.status === 'completed' ? 'completata' : marker.status === 'missed' ? 'da recuperare' : marker.status === 'skipped' ? `saltata${marker.detail ? ` · ${marker.detail}` : ''}` : 'programmata'}`);
    return `${formatDate(day.date, true)}${details.length ? ` · ${details.join(' · ')}` : ' · Riposo'}`;
  }

  function exerciseHistory(exerciseId: string, beforeDate: string) {
    return Object.values(sessions)
      .filter((session) => session.completedAt && session.date < beforeDate && session.logs[exerciseId]?.some((set) => set.completed))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function historyReps(logs: SetLog[]) {
    const values = logs.map((set) => set.reps).filter((value): value is number => value !== null);
    if (!values.length) return '—';
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return minimum === maximum ? String(minimum) : `${minimum}–${maximum}`;
  }

  function historyWeight(logs: SetLog[], unit: string) {
    const values = logs.map((set) => set.weight).filter((value): value is number => value !== null);
    if (!values.length) return '—';
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return `${minimum === maximum ? minimum : `${minimum}–${maximum}`} ${unit}`;
  }

  function historyEffort(logs: SetLog[]) {
    const value = logs.map((set) => set.effort).find((effort): effort is number => effort !== null);
    const level = effortLevel(value ?? null);
    return level ? `Fatica ${value}/4 · ${level.label}` : 'Fatica —';
  }

  function sessionHasData(session: Session) {
    return Boolean(session.completedAt || session.skippedReason || session.durationMinutes || session.cardioMinutes || session.notes.trim() || Object.values(session.logs).flat().some((set) => set.completed || set.skipped));
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

      <section class="card overflow-hidden">
        <div class="p-5 pb-4">
          <div class="flex items-start justify-between gap-4">
            <div><p class="eyebrow">La tua settimana</p><h2 class="mt-1 text-2xl font-extrabold tracking-[-0.04em]">Tutto in un colpo d'occhio</h2><p class="mt-1 text-xs capitalize text-muted">{weekRangeLabel()}</p></div>
            <div class="shrink-0 rounded-2xl bg-lime/40 px-3 py-2 text-right"><span class="block text-xl font-extrabold leading-none">{weekCompletedCount}/{weekPlannedCount}</span><span class="mt-1 block text-[0.58rem] font-bold uppercase tracking-wider text-muted">completate</span></div>
          </div>
          <div class="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.06]"><div class="h-full rounded-full bg-moss transition-all" style={`width: ${weekProgress}%`}></div></div>
        </div>
        <div class="border-t border-black/[0.05] px-3 py-2">
          {#each weekDays as day}
            <div class="flex min-h-16 items-center gap-3 border-b border-black/[0.05] py-2.5 last:border-0 {day.today ? 'rounded-2xl bg-lime/10 px-2' : 'px-2'}">
              <div class="w-10 shrink-0 text-center"><span class="block text-[0.62rem] font-extrabold uppercase tracking-wider {day.today ? 'text-moss' : 'text-muted'}">{day.dayLabel}</span><span class="mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold {day.today ? 'bg-ink text-lime' : 'bg-cream text-ink'}">{day.dateLabel}</span></div>
              {#if day.items.length}
                <div class="flex min-w-0 flex-1 flex-wrap gap-2">
                  {#each day.items as item}
                    <button
                      class="flex min-h-10 min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition active:scale-[0.98] disabled:cursor-default {item.completed ? 'border-moss bg-moss text-white' : item.skipped ? 'border-dashed border-black/15 bg-black/[0.03] text-muted' : item.missed ? 'border-amber-200 bg-amber-50 text-amber-800' : day.today ? 'border-moss/20 bg-lime/40 text-ink' : 'border-black/[0.06] bg-cream text-muted'}"
                      disabled={item.kind === 'activity' && (item.future || activitySaving)}
                      onclick={() => openWeekItem(day, item)}
                      aria-label={`${item.label}: ${weekItemStatus(item, day)}`}
                    >
                      <span class="grid h-7 w-7 shrink-0 place-items-center rounded-xl {item.completed ? 'bg-white/15' : 'bg-white'}">
                        {#if item.completed}<Check size={14} />{:else if item.skipped}<X size={14} />{:else if item.kind === 'workout'}<Dumbbell size={14} />{:else if item.type === 'run'}<Footprints size={14} />{:else}<Swords size={14} />{/if}
                      </span>
                      <span class="min-w-0"><span class="block truncate text-xs font-extrabold">{item.label}</span><span class="mt-0.5 block text-[0.58rem] font-semibold opacity-70">{weekItemStatus(item, day)}</span></span>
                    </button>
                  {/each}
                </div>
              {:else}
                <div class="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted"><span class="h-px w-5 bg-black/10"></span><span>Riposo</span></div>
              {/if}
            </div>
          {/each}
        </div>
        <div class="border-t border-black/[0.05] bg-cream/70 px-5 py-3 text-center text-[0.65rem] leading-4 text-muted">Tocca un'attività di oggi o passata per registrarla. Le attività future si attiveranno nel giorno previsto.</div>
      </section>

    </main>
  {:else if tab === 'calendar'}
    <main class="px-5">
      <p class="eyebrow pt-3">Programma completo</p>
      <h1 class="mt-2 text-4xl font-extrabold tracking-[-0.06em]">Calendario</h1>
      <p class="mt-2 text-sm leading-6 text-muted">Palestra: mar A · gio B · sab C<br />Corsa: lun · mer · ven · Wing Chun: lun · mer dalla seconda settimana</p>

      <div class="mt-7 space-y-3">
        {#each plan as item, index}
          {@const complete = Boolean(sessions[item.date]?.completedAt)}
          {@const skippedReason = sessions[item.date]?.skippedReason ?? null}
          {@const past = item.date < todayKey}
          {@const month = monthNumber(startDate, item.date)}
          {#if index === 0 || monthNumber(startDate, plan[index - 1].date) !== month}
            <div class="flex items-center gap-3 pb-1 pt-5 first:pt-0">
              <p class="eyebrow">Mese {month} · {monthThemes[month - 1].title}</p><span class="h-px flex-1 bg-black/10"></span>
            </div>
          {/if}
          <button class="card flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.99] {past && !complete ? 'opacity-55' : ''}" onclick={() => openWorkout(item.date, item.type)}>
            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl {complete ? 'bg-moss text-white' : 'bg-cream'}">
              {#if complete}<LockKeyhole size={19} />{:else}<span class="font-extrabold">{item.type}</span>{/if}
            </span>
            <span class="min-w-0 flex-1"><span class="block capitalize font-bold">{formatDate(item.date, true)}</span><span class="mt-0.5 block truncate text-xs text-muted">{workouts[item.type].focus}</span><span class="mt-0.5 block text-[0.62rem] font-bold uppercase tracking-wider {complete ? 'text-moss' : skippedReason ? 'text-muted' : past ? 'text-amber-700' : 'text-muted'}">{complete ? 'Completata' : skippedReason ? `Saltata · ${skipReasonLabel(skippedReason)}` : past ? 'Da recuperare' : 'Prevista'}</span></span>
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
        {#if skippedDueCount > 0}<p class="mt-1 text-xs leading-5 text-muted">Saltate: {skippedDueCount} ({skippedDueForza} per causa maggiore · {skippedDuePigrizia} per pigrizia).</p>{/if}
        <div class="mt-7">
          <div class="grid items-center gap-1.5" style="grid-template-columns: 4.5rem repeat(7, minmax(0, 1fr));">
            <span></span>
            {#each ['L', 'M', 'M', 'G', 'V', 'S', 'D'] as dayLabel}
              <span class="text-center text-[0.58rem] font-bold uppercase text-muted">{dayLabel}</span>
            {/each}
          </div>
          <div class="mt-2 space-y-2">
            {#each contributionWeeks() as week}
              <div class="grid items-center gap-1.5" style="grid-template-columns: 4.5rem repeat(7, minmax(0, 1fr));">
                <div class="min-w-0"><p class="truncate text-[0.65rem] font-bold capitalize">{week.label}</p><p class="text-[0.58rem] text-muted">{week.done}/{week.planned} fatte</p></div>
                {#each week.days as day}
                  <div
                    class="flex aspect-square min-w-0 flex-wrap items-center justify-center gap-0.5 rounded-lg px-0.5 text-[0.5rem] font-extrabold leading-none {day.status === 'completed' ? 'bg-moss text-white' : day.status === 'partial' ? 'bg-lime text-ink' : day.status === 'missed' ? 'bg-amber-100 text-amber-800' : day.status === 'skipped' ? 'bg-black/[0.07] text-muted' : day.status === 'scheduled' ? 'border border-moss/20 bg-lime/30 text-moss' : day.status === 'rest' ? 'bg-black/[0.045] text-transparent' : 'bg-transparent text-transparent'}"
                    title={contributionTitle(day)}
                    aria-label={contributionTitle(day)}
                  >{#each day.markers as marker}<span>{marker.label}</span>{:else}<span>·</span>{/each}</div>
                {/each}
              </div>
            {/each}
          </div>
          <div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.62rem] text-muted">
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-moss"></span>Completata</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-lime"></span>Parziale</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-amber-100"></span>Da recuperare</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-black/[0.07]"></span>Saltata</span>
            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded border border-moss/20 bg-lime/30"></span>Programmata</span>
          </div>
        </div>
        <p class="mt-3 text-xs leading-5 text-muted">Una riga per settimana, fino a un massimo di 8. A/B/C = palestra · R = corsa · W = Wing Chun.</p>
      </section>

      <section class="mt-3 grid grid-cols-3 gap-2">
        <div class="card p-4"><p class="text-2xl font-extrabold tracking-[-0.05em]">{totalCompletedSets}</p><p class="mt-1 text-[0.65rem] leading-4 text-muted">serie in sedute concluse</p></div>
        <div class="card p-4"><p class="text-2xl font-extrabold tracking-[-0.05em]">{totalTrainingMinutes}</p><p class="mt-1 text-[0.65rem] leading-4 text-muted">min di durata registrata</p></div>
        <div class="card p-4"><p class="text-2xl font-extrabold tracking-[-0.05em]">{totalCardioMinutes}</p><p class="mt-1 text-[0.65rem] leading-4 text-muted">min di cardio registrato</p></div>
      </section>

      <section class="card mt-3 p-5">
        <p class="eyebrow">Attività complementari svolte</p>
        <div class="mt-4 grid grid-cols-3 gap-3">
          <div><p class="text-2xl font-extrabold tracking-[-0.05em]">{completedRuns.length}</p><p class="mt-1 text-[0.65rem] text-muted">corse</p></div>
          <div><p class="text-2xl font-extrabold tracking-[-0.05em]">{totalRunDistance}</p><p class="mt-1 text-[0.65rem] text-muted">km registrati</p></div>
          <div><p class="text-2xl font-extrabold tracking-[-0.05em]">{completedWingChun}</p><p class="mt-1 text-[0.65rem] text-muted">Wing Chun</p></div>
        </div>
        {#if skippedActivitiesCount > 0}<p class="mt-3 text-xs leading-5 text-muted">Attività complementari saltate: {skippedActivitiesCount}.</p>{/if}
      </section>

      <section class="mt-7">
        <div class="flex items-center justify-between"><h2 class="text-xl font-bold tracking-[-0.03em]">Ultime sedute</h2><RotateCcw size={18} class="text-muted" /></div>
        <div class="mt-3 space-y-3">
          {#each Object.values(sessions).filter(sessionHasData).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8) as session}
            <button class="card flex w-full items-center gap-4 p-4 text-left" onclick={() => openWorkout(session.date, session.type)}>
              <span class="grid h-11 w-11 place-items-center rounded-2xl {session.completedAt ? 'bg-moss text-white' : 'bg-lime/40 text-ink'} font-bold">{session.type}</span>
              <span class="min-w-0 flex-1"><span class="block capitalize font-bold">{formatDate(session.date)}</span><span class="mt-0.5 block truncate text-xs text-muted">{Object.values(session.logs).flat().filter((s) => s.completed).length} serie completate{session.durationMinutes ? ` · ${session.durationMinutes} min totali` : ''}{session.cardioMinutes ? ` · ${session.cardioMinutes} min cardio` : ''}</span><span class="mt-1 block text-[0.62rem] font-bold uppercase tracking-wider {session.completedAt ? 'text-moss' : 'text-muted'}">{session.completedAt ? 'Completata' : session.skippedReason ? `Saltata · ${skipReasonLabel(session.skippedReason)}` : 'In corso'}</span></span>
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
        <div class="grid h-11 w-11 place-items-center" aria-live="polite">
          {#if autoSaveStatus === 'pending' || autoSaveStatus === 'saving'}
            <LoaderCircle class="animate-spin text-muted/60" size={18} aria-label="Salvataggio in corso" />
          {:else if autoSaveStatus === 'saved'}
            <CircleCheck class="text-moss/70" size={19} aria-label="Progressi salvati" />
          {:else if autoSaveStatus === 'error'}
            <button class="grid h-9 w-9 place-items-center rounded-full text-amber-700" onclick={() => saveSession()} aria-label="Salvataggio non riuscito, riprova" title="Salvataggio non riuscito. Tocca per riprovare."><CircleAlert size={19} /></button>
          {/if}
        </div>
      </header>

      <main class="px-5 pt-6">
        <h1 class="text-4xl font-extrabold tracking-[-0.06em]">{workouts[activeSession.type].title}</h1>
        <p class="mt-2 text-sm text-muted">{workouts[activeSession.type].focus}</p>

        {#if activeSession.completedAt}
          <section class="mt-6 flex items-center gap-3 rounded-[1.75rem] bg-ink p-5 text-white">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-lime"><LockKeyhole size={19} /></span>
            <div><h2 class="font-bold">Allenamento concluso e bloccato</h2><p class="mt-1 text-xs leading-5 text-white/65">Puoi consultare tutti i dati, ma non modificarli per sbaglio.</p></div>
          </section>
        {/if}

        {#if activeSession.skippedReason && !activeSession.completedAt}
          <section class="mt-6 rounded-[1.75rem] bg-black/[0.04] p-5">
            <div class="flex items-center gap-3"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-muted"><X size={19} /></span><div><h2 class="font-bold">Seduta saltata · {skipReasonLabel(activeSession.skippedReason)}</h2>{#if activeSession.notes.trim()}<p class="mt-1 text-xs leading-5 text-muted">{activeSession.notes}</p>{/if}</div></div>
            <button class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 font-bold text-white transition active:scale-[0.99] disabled:opacity-60" disabled={workoutSkipping} onclick={unskipActiveWorkout}>
              {#if workoutSkipping}<LoaderCircle class="animate-spin" size={17} /> Attendi…{:else}<RotateCcw size={17} /> Rimettimi in programma{/if}
            </button>
          </section>
        {/if}

        {#if !activeSession.completedAt && !activeSession.skippedReason && !sessionIsComplete(activeSession)}
          {#if sessionStartedAt === null}
            <button class="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 font-bold text-white shadow-card transition active:scale-[0.99]" onclick={startWorkout}><Play size={18} fill="currentColor" /> Inizia allenamento</button>
          {:else}
            <section class="card mt-6 flex items-center justify-between px-5 py-4">
              <div><p class="eyebrow">Tempo allenamento</p><p class="mt-1 text-xs text-muted">Il contatore si fermerà al completamento.</p></div>
              <p class="font-mono text-2xl font-extrabold tracking-[-0.04em] tabular-nums">{formatElapsed(elapsedSeconds)}</p>
            </section>
          {/if}
        {/if}

        <div class="mt-7 space-y-4">
          {#each workouts[activeSession.type].exercises as exercise, exerciseIndex}
            {@const exerciseMode = modeFor(exercise)}
            {@const exerciseLogs = activeSession.logs[exercise.id]}
            {@const exerciseSkipped = exerciseLogs.every((set) => set.skipped)}
            {@const exerciseEffort = exerciseLogs[0]?.effort ?? null}
            {@const exerciseEffortLevel = effortLevel(exerciseEffort)}
            <section class="card overflow-hidden {exerciseSkipped ? 'opacity-70' : ''}">
              <div class="flex items-start justify-between gap-3 p-5 pb-3">
                <div><p class="eyebrow">{String(exerciseIndex + 1).padStart(2, '0')}</p><h2 class="mt-1 text-lg font-bold tracking-[-0.03em]">{exercise.name}</h2></div>
                <div class="flex max-w-[12rem] shrink-0 flex-wrap items-center justify-end gap-2">
                  <button class="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white text-moss active:scale-95" onclick={() => historyExercise = { exercise, beforeDate: activeSession!.date }} aria-label={`Storico di ${exercise.name}`} title="Storico esercizio"><History size={15} /></button>
                  <button class="grid h-8 w-8 place-items-center rounded-full border border-black/10 {exerciseSkipped ? 'bg-amber-100 text-amber-800' : 'bg-white text-muted'} active:scale-95 disabled:opacity-40" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason)} onclick={() => toggleExerciseSkipped(exercise.id)} aria-label={exerciseSkipped ? `Ripristina ${exercise.name}` : `Escludi ${exercise.name} da questa seduta`} title={exerciseSkipped ? 'Ripristina esercizio' : 'Escludi dalla seduta'}>{#if exerciseSkipped}<RotateCcw size={14} />{:else}<X size={14} />{/if}</button>
                  <button class="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-moss active:scale-95" onclick={() => activeGuide = { type: activeSession!.type, exerciseId: exercise.id, index: exerciseIndex }} aria-label={`Guida per ${exercise.name}`}><BookOpen size={14} /> Guida</button>
                  <span class="rounded-full bg-lime/50 px-3 py-1.5 text-xs font-bold">{exercise.sets} × {exercise.reps}</span>
                </div>
              </div>
              {#if exercise.note}<p class="px-5 pb-3 text-xs leading-5 text-muted">{exercise.note}</p>{/if}
              {#if exerciseSkipped}<p class="mx-4 mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">Escluso volontariamente da questa seduta. Tocca ↻ per ripristinarlo.</p>{/if}
              <div class="border-t border-black/[0.05] p-4">
                {#if exerciseMode === 'strength'}
                  <p class="eyebrow mb-2">Uguale per tutte le serie</p>
                  <div class="grid grid-cols-2 gap-2">
                    <div class="rounded-2xl bg-cream p-2">
                      <span class="block text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted">Peso · {exercise.unit}</span>
                      <div class="mt-1 flex items-center gap-1">
                        <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white disabled:opacity-35" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} onclick={() => adjustAll(exercise.id, 'weight', exercise.unit.includes('mano') ? -1 : -2.5)} aria-label="Riduci peso per tutte le serie"><Minus size={13} /></button>
                        <input class="min-w-0 w-full bg-transparent text-center text-base font-bold outline-none disabled:opacity-60" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} type="number" step="0.5" placeholder="—" value={exerciseLogs[0]?.weight ?? ''} oninput={(event) => inputForAll(exercise.id, 'weight', event)} aria-label="Peso per tutte le serie" />
                        <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white disabled:opacity-35" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} onclick={() => adjustAll(exercise.id, 'weight', exercise.unit.includes('mano') ? 1 : 2.5)} aria-label="Aumenta peso per tutte le serie"><Plus size={13} /></button>
                      </div>
                    </div>
                    <div class="rounded-2xl bg-cream p-2">
                      <span class="block text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted">Ripetizioni</span>
                      <div class="mt-1 flex items-center gap-1">
                        <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white disabled:opacity-35" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} onclick={() => adjustAll(exercise.id, 'reps', -1)} aria-label="Riduci ripetizioni per tutte le serie"><Minus size={13} /></button>
                        <input class="min-w-0 w-full bg-transparent text-center text-base font-bold outline-none disabled:opacity-60" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} type="number" placeholder="—" value={exerciseLogs[0]?.reps ?? ''} oninput={(event) => inputForAll(exercise.id, 'reps', event)} aria-label="Ripetizioni per tutte le serie" />
                        <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white disabled:opacity-35" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} onclick={() => adjustAll(exercise.id, 'reps', 1)} aria-label="Aumenta ripetizioni per tutte le serie"><Plus size={13} /></button>
                      </div>
                    </div>
                  </div>
                  <div class="mt-3 rounded-2xl border border-black/[0.05] bg-cream p-4">
                    <div class="flex items-center justify-between gap-3">
                      <div><span class="block text-xs font-extrabold text-ink">Quanto ti ha affaticato?</span><span class="mt-0.5 block text-[0.68rem] text-muted">Un solo valore per tutto l'esercizio</span></div>
                      <span class="rounded-full px-3 py-1.5 text-xs font-extrabold text-white shadow-sm" style={`background-color: ${exerciseEffortLevel?.color ?? '#6D786F'}`}>{exerciseEffortLevel ? `${exerciseEffort}/4 · ${exerciseEffortLevel.label}` : 'Scegli 1–4'}</span>
                    </div>
                    <input class="effort-range mt-4 w-full disabled:opacity-50" style={effortTrackStyle(exerciseEffort)} disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} type="range" min="1" max="4" step="1" value={exerciseEffort ?? 2} oninput={(event) => inputEffortForAll(exercise.id, event)} aria-label={`Fatica percepita per ${exercise.name}, da 1 a 4`} />
                    <div class="mt-2 grid grid-cols-4 text-center text-[0.58rem] font-bold leading-3 text-muted"><span>1<br />Leggero</span><span>2<br />Giusto</span><span>3<br />Duro</span><span>4<br />Al limite</span></div>
                    <p class="mt-3 text-center text-[0.65rem] font-semibold" style={`color: ${exerciseEffortLevel?.color ?? '#6D786F'}`}>{exerciseEffortLevel?.detail ?? 'Sposta la barra dopo aver finito l’esercizio'}</p>
                  </div>
                {:else if exerciseMode === 'timed'}
                  <div class="rounded-2xl bg-cream p-2">
                    <span class="block text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted">Durata per ogni tenuta · secondi</span>
                    <div class="mx-auto mt-1 flex max-w-48 items-center gap-1">
                      <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white disabled:opacity-35" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} onclick={() => adjustAll(exercise.id, 'reps', -5)} aria-label="Riduci durata"><Minus size={13} /></button>
                      <input class="min-w-0 w-full bg-transparent text-center text-base font-bold outline-none disabled:opacity-60" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} type="number" placeholder="20" value={exerciseLogs[0]?.reps ?? ''} oninput={(event) => inputForAll(exercise.id, 'reps', event)} aria-label="Secondi per ogni tenuta" />
                      <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white disabled:opacity-35" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} onclick={() => adjustAll(exercise.id, 'reps', 5)} aria-label="Aumenta durata"><Plus size={13} /></button>
                    </div>
                  </div>
                {:else if exerciseMode === 'carry'}
                  <label class="block rounded-2xl bg-cream p-3">
                    <span class="block text-center text-[0.62rem] font-bold uppercase tracking-wider text-muted">Carico facoltativo · {exercise.unit}</span>
                    <input class="mt-1 w-full bg-transparent text-center text-base font-bold outline-none disabled:opacity-60" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} type="number" step="0.5" placeholder="Non indicato" value={exerciseLogs[0]?.weight ?? ''} oninput={(event) => inputForAll(exercise.id, 'weight', event)} aria-label="Carico farmer carry per tutti i giri" />
                  </label>
                {:else}
                  <p class="rounded-2xl bg-cream p-3 text-center text-sm text-muted">Nessun peso o numero di ripetizioni da inserire.</p>
                {/if}

                <div class="mt-3 grid grid-cols-2 gap-2">
                  {#each exerciseLogs as set}
                    <button class="flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 font-bold transition disabled:cursor-default {set.completed ? 'bg-moss text-white' : 'bg-cream text-ink'}" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason) || exerciseSkipped} onclick={() => toggleSet(set)} aria-label={`Completa ${exerciseMode === 'carry' ? 'giro' : 'serie'} ${set.setNumber}`}>
                      <span class="grid h-6 w-6 place-items-center rounded-full {set.completed ? 'bg-white/20' : 'bg-white'}">{#if set.completed}<Check size={14} />{:else}<span class="text-xs">{set.setNumber}</span>{/if}</span>
                      {exerciseMode === 'carry' ? 'Giro' : exerciseMode === 'mobility' ? 'Sequenza' : exerciseMode === 'timed' ? 'Tenuta' : 'Serie'} {set.setNumber}
                    </button>
                  {/each}
                </div>
                {#if !activeSession.completedAt && !activeSession.skippedReason && !exerciseSkipped}
                  <div class="mt-2 flex gap-2">
                    <button class="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-dashed border-black/15 px-3 py-2.5 text-xs font-bold text-muted transition active:scale-[0.99]" onclick={() => addSet(exercise.id)} aria-label={`Aggiungi un ${setUnitLabel(exercise)} a ${exercise.name}`}><Plus size={14} /> Aggiungi {setUnitLabel(exercise)}{exerciseLogs.length > exercise.sets ? ` (${exerciseLogs.length})` : ''}</button>
                    {#if exerciseLogs.length > exercise.sets}
                      <button class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-black/10 text-muted transition active:scale-95" onclick={() => removeAddedSet(exercise.id, exercise.sets)} aria-label={`Rimuovi l'ultimo ${setUnitLabel(exercise)} aggiunto`} title="Rimuovi l'ultimo aggiunto"><Minus size={14} /></button>
                    {/if}
                  </div>
                {/if}
              </div>
            </section>
          {/each}
        </div>

        {#if sessionIsComplete(activeSession) && !activeSession.completedAt && !activeSession.skippedReason}
          <section class="mt-4 rounded-[1.75rem] bg-moss p-5 text-white" aria-live="polite">
            <div class="flex items-center gap-3"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15"><Check size={20} /></span><div><h2 class="font-bold">Seduta pronta per la chiusura</h2><p class="mt-1 text-xs leading-5 text-white/75">Le attività svolte sono complete; quelle escluse restano indicate come tali. Aggiungi eventuali tempi e note, poi chiudi.</p></div></div>
          </section>
        {/if}

        <section class="card mt-4 p-5">
          <h2 class="font-bold">Chiusura seduta</h2>
          <p class="mt-1 text-xs leading-5 text-muted">Tutto facoltativo. Il tempo totale viene calcolato automaticamente se lo lasci vuoto. {workouts[activeSession.type].cardio}</p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <label class="rounded-2xl bg-cream p-3"><span class="eyebrow">Tempo totale</span><span class="mt-1 flex items-center gap-1"><input class="w-full bg-transparent text-xl font-bold outline-none disabled:opacity-60" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason)} type="number" placeholder="Auto" value={activeSession.durationMinutes ?? ''} oninput={(event) => updateSessionNumber('durationMinutes', event)} /><span class="text-xs text-muted">min</span></span><span class="mt-1 block text-[0.65rem] text-muted">Intera seduta</span></label>
            <label class="rounded-2xl bg-cream p-3"><span class="eyebrow">Cardio extra</span><span class="mt-1 flex items-center gap-1"><input class="w-full bg-transparent text-xl font-bold outline-none disabled:opacity-60" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason)} type="number" placeholder="—" value={activeSession.cardioMinutes ?? ''} oninput={(event) => updateSessionNumber('cardioMinutes', event)} /><span class="text-xs text-muted">min</span></span><span class="mt-1 block text-[0.65rem] text-muted">Solo se svolto</span></label>
          </div>
          <textarea class="mt-3 min-h-24 w-full resize-none rounded-2xl bg-cream p-4 text-sm outline-none placeholder:text-muted/60 disabled:opacity-60" disabled={Boolean(activeSession.completedAt || activeSession.skippedReason)} placeholder="Come ti sei sentito? Note sulla tecnica…" value={activeSession.notes} oninput={updateSessionNotes}></textarea>
          {#if !activeSession.completedAt && !activeSession.skippedReason}
            <div class="mt-3 rounded-2xl bg-cream p-4">
              <p class="text-xs font-extrabold text-ink">Non riesci a farla?</p>
              <p class="mt-0.5 text-[0.68rem] leading-4 text-muted">Segnala la seduta come saltata invece di lasciarla in sospeso. Puoi scrivere il motivo nelle note qui sopra.</p>
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button class="rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:opacity-60" disabled={workoutSkipping} onclick={() => skipActiveWorkout('forza_maggiore')}>Causa maggiore</button>
                <button class="rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:opacity-60" disabled={workoutSkipping} onclick={() => skipActiveWorkout('pigrizia')}>Pigrizia</button>
              </div>
            </div>
          {/if}
          {#if sessionIsComplete(activeSession) && !activeSession.completedAt && !activeSession.skippedReason}
            <button class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3.5 font-bold text-white transition active:scale-[0.99] disabled:opacity-60" disabled={finishing} onclick={finishWorkout}>
              {#if finishing}<LoaderCircle class="animate-spin" size={17} /> Conclusione…{:else}<LockKeyhole size={17} /> Concludi e blocca{/if}
            </button>
            <p class="mt-2 text-center text-[0.65rem] leading-4 text-muted">Dopo la chiusura i dati resteranno consultabili, ma non saranno più modificabili.</p>
          {/if}
        </section>
      </main>
    </div>
  </div>
{/if}

{#if activeActivity}
  {@const activityEffortLevel = effortLevel(activeActivity.rpe)}
  <div class="fixed inset-0 z-[65] flex items-end justify-center bg-black/35 p-3 sm:items-center" role="presentation" onclick={(event) => event.currentTarget === event.target && (activeActivity = null)}>
    <form class="card max-h-[90vh] w-full max-w-md overflow-auto p-6" onsubmit={(event) => { event.preventDefault(); void saveActiveActivity(); }}>
      <div class="flex items-start justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl {activeActivity.type === 'run' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}">
            {#if activeActivity.type === 'run'}<Footprints size={20} />{:else}<Swords size={20} />{/if}
          </span>
          <div><p class="eyebrow">{activeActivity.type === 'run' ? 'Mattina' : 'Sera'} · <span class="capitalize">{formatDate(activeActivity.date)}</span></p><h2 class="mt-1 text-2xl font-extrabold tracking-[-0.05em]">{activityName(activeActivity.type)}</h2></div>
        </div>
        <button class="icon-button shrink-0" type="button" onclick={() => activeActivity = null} aria-label="Chiudi"><X size={19} /></button>
      </div>

      {#if activeActivity.skippedReason && !activeActivity.completedAt}
        <div class="mt-5 rounded-2xl bg-black/[0.04] p-4">
          <p class="text-sm font-extrabold">Saltata · {skipReasonLabel(activeActivity.skippedReason)}</p>
          {#if activeActivity.notes.trim()}<p class="mt-1 text-xs leading-5 text-muted">{activeActivity.notes}</p>{/if}
        </div>
      {/if}
      <p class="mt-5 text-sm leading-6 text-muted">{activeActivity.type === 'run' ? 'Giro standard · 1,3 km · scatto facoltativo negli ultimi 150 metri.' : 'Compila solo quello che ti è utile.'} Salvare significa segnare l’attività come svolta.</p>
      <div class="mt-5">
        <label class="block rounded-2xl bg-cream p-3"><span class="eyebrow">Durata</span><span class="mt-1 flex items-center gap-1"><input class="min-w-0 w-full bg-transparent text-xl font-bold outline-none" type="number" min="1" placeholder="—" value={activeActivity.durationMinutes ?? ''} oninput={(event) => activeActivity!.durationMinutes = event.currentTarget.value === '' ? null : Number(event.currentTarget.value)} /><span class="text-xs text-muted">min</span></span></label>
      </div>

      <div class="mt-3 rounded-2xl bg-cream p-4">
        <div class="flex items-center justify-between gap-3">
          <span class="eyebrow">Intensità percepita</span>
          <span class="rounded-full px-3 py-1.5 text-xs font-extrabold text-white shadow-sm" style={`background-color: ${activityEffortLevel?.color ?? '#6D786F'}`}>{activityEffortLevel ? `${activeActivity.rpe}/4 · ${activityEffortLevel.label}` : 'Scegli 1–4'}</span>
        </div>
        <input class="effort-range mt-4 w-full" style={effortTrackStyle(activeActivity.rpe)} type="range" min="1" max="4" step="1" value={activeActivity.rpe ?? 2} oninput={inputActivityEffort} aria-label={`Intensità percepita per ${activityName(activeActivity.type)}, da 1 a 4`} />
        <p class="mt-3 text-center text-[0.65rem] font-semibold" style={`color: ${activityEffortLevel?.color ?? '#6D786F'}`}>{activityEffortLevel?.detail ?? 'Sposta la barra dopo aver finito'}</p>
      </div>

      {#if activeActivity.type === 'run'}
        <div class="mt-3 grid grid-cols-2 gap-3">
          <label class="rounded-2xl bg-cream p-3"><span class="eyebrow">Distanza</span><span class="mt-1 flex items-center gap-1"><input class="min-w-0 w-full bg-transparent text-xl font-bold outline-none" type="number" min="0.1" step="0.1" value={activeActivity.distanceKm ?? ''} oninput={(event) => activeActivity!.distanceKm = event.currentTarget.value === '' ? null : Number(event.currentTarget.value)} /><span class="text-xs text-muted">km</span></span></label>
          <label class="flex cursor-pointer items-center justify-between gap-2 rounded-2xl bg-cream p-3"><span><span class="eyebrow">Scatto finale</span><span class="mt-1 block text-xs text-muted">Ultimi 150 metri</span></span><input class="h-5 w-5 accent-[#315B47]" type="checkbox" checked={activeActivity.sprintCompleted} onchange={(event) => activeActivity!.sprintCompleted = event.currentTarget.checked} /></label>
        </div>
      {/if}

      <label class="mt-3 block"><span class="eyebrow ml-1">Note</span><textarea class="mt-2 min-h-24 w-full resize-none rounded-2xl bg-cream p-4 text-sm outline-none placeholder:text-muted/60" placeholder="Come ti sei sentito? Oppure il motivo del salto…" value={activeActivity.notes} oninput={(event) => activeActivity!.notes = event.currentTarget.value}></textarea></label>
      {#if !activeActivity.completedAt && !activeActivity.skippedReason}
        <div class="mt-3 rounded-2xl bg-cream p-4">
          <p class="text-xs font-extrabold text-ink">Non riesci a farla?</p>
          <p class="mt-0.5 text-[0.68rem] leading-4 text-muted">Segnala l’attività come saltata invece di lasciarla in sospeso.</p>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button class="rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:opacity-60" type="button" disabled={activitySaving} onclick={() => skipActiveActivity('forza_maggiore')}>Causa maggiore</button>
            <button class="rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-xs font-bold transition active:scale-[0.98] disabled:opacity-60" type="button" disabled={activitySaving} onclick={() => skipActiveActivity('pigrizia')}>Pigrizia</button>
          </div>
        </div>
      {/if}
      <button class="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-4 font-bold text-white disabled:opacity-60" type="submit" disabled={activitySaving}>
        {#if activitySaving}<LoaderCircle class="animate-spin" size={17} /> Salvataggio…{:else}<Check size={17} /> {activeActivity.completedAt ? 'Aggiorna attività' : 'Segna come svolta'}{/if}
      </button>
      {#if activeActivity.completedAt || activeActivity.skippedReason}
        <button class="mt-3 w-full py-2 text-sm font-bold text-red-700 disabled:opacity-50" type="button" disabled={activitySaving} onclick={removeActiveActivity}>{activeActivity.skippedReason && !activeActivity.completedAt ? 'Rimetti in programma' : 'Segna come non svolta'}</button>
      {/if}
    </form>
  </div>
{/if}

{#if historyExercise}
  {@const previousSessions = exerciseHistory(historyExercise.exercise.id, historyExercise.beforeDate)}
  {@const historyMode = modeFor(historyExercise.exercise)}
  <div class="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 p-3 sm:items-center" role="presentation" onclick={(event) => event.currentTarget === event.target && (historyExercise = null)}>
    <div class="card max-h-[85vh] w-full max-w-md overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="history-title">
      <header class="flex items-start justify-between gap-4 border-b border-black/[0.06] p-5">
        <div><p class="eyebrow">Le volte precedenti</p><h2 id="history-title" class="mt-1 text-2xl font-extrabold tracking-[-0.05em]">{historyExercise.exercise.name}</h2><p class="mt-1 text-xs text-muted">Solo allenamenti conclusi prima di questa seduta.</p></div>
        <button class="icon-button shrink-0" onclick={() => historyExercise = null} aria-label="Chiudi storico"><X size={19} /></button>
      </header>

      <div class="max-h-[65vh] overflow-auto p-5">
        {#if previousSessions.length}
          <table class="w-full border-separate border-spacing-0 text-left text-sm">
            <thead class="sticky top-0 bg-white text-[0.62rem] font-bold uppercase tracking-wider text-muted">
              <tr><th class="border-b border-black/10 pb-2 pr-3">Data</th><th class="border-b border-black/10 px-2 pb-2 text-center">Serie</th><th class="border-b border-black/10 px-2 pb-2 text-right">{historyMode === 'timed' ? 'Secondi' : 'Rip.'}</th><th class="border-b border-black/10 pb-2 pl-2 text-right">Carico</th></tr>
            </thead>
            <tbody>
              {#each previousSessions as session}
                {@const logs = session.logs[historyExercise.exercise.id]}
                <tr>
                  <td class="border-b border-black/[0.05] py-3 pr-3"><span class="block text-xs font-semibold capitalize">{formatDate(session.date)}</span><span class="mt-0.5 block text-[0.58rem] font-bold uppercase tracking-wider text-muted">Seduta {session.type}</span></td>
                  <td class="border-b border-black/[0.05] px-2 py-3 text-center font-semibold tabular-nums">{logs.filter((set) => set.completed).length}</td>
                  <td class="border-b border-black/[0.05] px-2 py-3 text-right font-semibold tabular-nums">{historyReps(logs)}</td>
                  <td class="whitespace-nowrap border-b border-black/[0.05] py-3 pl-2 text-right font-semibold tabular-nums"><span class="block">{historyWeight(logs, historyExercise.exercise.unit)}</span>{#if historyMode === 'strength'}<span class="mt-0.5 block text-[0.6rem] font-bold uppercase tracking-wider text-muted">{historyEffort(logs)}</span>{/if}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <div class="rounded-2xl bg-cream p-7 text-center"><History class="mx-auto text-muted" size={22} /><p class="mt-3 font-bold">Nessun dato precedente</p><p class="mt-1 text-xs leading-5 text-muted">Lo storico apparirà dopo il primo allenamento concluso con questo esercizio.</p></div>
        {/if}
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
  {@const illustratedExercises = workouts[activeGuide.type].exercises.filter((exercise) => !exerciseGuides[exercise.id].image)}
  {@const panelCount = illustratedExercises.length}
  {@const panelIndex = illustratedExercises.findIndex((exercise) => exercise.id === guideExercise.id)}
  <div class="fixed inset-0 z-[55] overflow-y-auto bg-cream">
    <div class="mx-auto min-h-screen max-w-lg pb-10">
      <header class="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.05] bg-cream/95 px-5 py-4 backdrop-blur">
        <button class="icon-button" onclick={() => activeGuide = null} aria-label="Torna alla seduta"><ChevronLeft size={21} /></button>
        <p class="text-sm font-bold">Come si esegue</p>
        <span class="w-11"></span>
      </header>

      <main class="px-5 pt-5">
        {#if guide.image}
          <img class="w-full rounded-[1.75rem] border border-black/[0.06] bg-white shadow-card" src={guide.image} alt={`Esecuzione illustrata di ${guideExercise.name}, posizione iniziale e finale`} />
        {:else}
          <div class="overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-white shadow-card" style={`aspect-ratio: ${864 / (1821 / panelCount)}`}>
            <div class="relative h-full w-full overflow-hidden">
              <img
                class="absolute left-0 top-0 h-auto w-full max-w-none"
                style={`transform: translateY(-${panelIndex / panelCount * 100}%)`}
                src={`/guides/workout-${activeGuide.type.toLowerCase()}.webp`}
                alt={`Esecuzione illustrata di ${guideExercise.name}, posizione iniziale e finale`}
              />
            </div>
          </div>
        {/if}

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

<style>
  .effort-range {
    height: 0.55rem;
    appearance: none;
    border-radius: 9999px;
    cursor: pointer;
  }

  .effort-range::-webkit-slider-thumb {
    height: 1.7rem;
    width: 1.7rem;
    appearance: none;
    border: 4px solid white;
    border-radius: 9999px;
    background: #17211b;
    box-shadow: 0 3px 10px rgba(23, 33, 27, 0.24);
  }

  .effort-range::-moz-range-thumb {
    height: 1.2rem;
    width: 1.2rem;
    border: 4px solid white;
    border-radius: 9999px;
    background: #17211b;
    box-shadow: 0 3px 10px rgba(23, 33, 27, 0.24);
  }
</style>
