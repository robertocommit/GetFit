import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exerciseSuggestion } from '../src/lib/progression.ts';

const bench = { id: 'bench', sets: 4, minReps: 8, maxReps: 10, startWeight: 40, increment: 2.5, unit: 'kg' };
const logs = (reps = 10, effort = 2) => Array.from({ length: 4 }, (_, i) => ({
  setNumber: i + 1, reps, weight: 40, effort, completed: true, skipped: false
}));

test('increases load at the top of the range with recorded manageable effort', () => {
  const suggestion = exerciseSuggestion(bench, logs());
  assert.equal(suggestion.weight, 42.5);
  assert.equal(suggestion.reps, 8);
});

test('return after a break holds load even when the previous workout qualified', () => {
  const suggestion = exerciseSuggestion(bench, logs(), true);
  assert.equal(suggestion.weight, 40);
  assert.equal(suggestion.reps, 10);
  assert.match(suggestion.message, /Rientro/);
});

test('holds load when effort is missing, hard, or at the limit', () => {
  for (const effort of [null, 3, 4]) {
    assert.equal(exerciseSuggestion(bench, logs(12, effort)).weight, 40);
  }
});

test('does not increase load for skipped or unfinished sets or insufficient volume', () => {
  for (const previous of [
    logs().slice(0, 3),
    logs().map((set, i) => i === 3 ? { ...set, completed: false } : set),
    logs().map((set, i) => i === 3 ? { ...set, skipped: true } : set)
  ]) assert.equal(exerciseSuggestion(bench, previous).weight, 40);
});

test('adds repetitions before weight and respects the weakest recorded set', () => {
  const previous = logs(9).map((set, i) => i === 3 ? { ...set, reps: 8 } : set);
  const suggestion = exerciseSuggestion(bench, previous);
  assert.equal(suggestion.weight, 40);
  assert.equal(suggestion.reps, 9);
});

test('does not increase load after sets performed at different weights', () => {
  const previous = logs().map((set, i) => i === 0 ? { ...set, weight: 35 } : set);
  assert.equal(exerciseSuggestion(bench, previous).weight, 40);
});

test('first workout uses the configured start load', () => {
  const suggestion = exerciseSuggestion(bench, []);
  assert.equal(suggestion.weight, 40);
  assert.equal(suggestion.reps, 8);
});

test('timed exercises and carries do not receive strength progression', () => {
  for (const tracking of ['timed', 'carry', 'mobility']) {
    assert.equal(exerciseSuggestion({ ...bench, tracking }, logs()).weight, 40);
  }
});

test('unknown or zero starting weights are retained without inventing a load', () => {
  assert.equal(exerciseSuggestion({ ...bench, startWeight: null }, []).weight, null);
  assert.equal(exerciseSuggestion({ ...bench, startWeight: 0 }, []).weight, 0);
});
