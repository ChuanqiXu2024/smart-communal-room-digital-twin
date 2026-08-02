import { describe, expect, it } from 'vitest';

import {
  INITIAL_SIGNAL_VALUES,
  SignalSimulation,
  createInitialSignalSnapshot,
  formatSignal,
  getEngagementStatus,
  getLightingStatus,
  getOccupancyStatus,
  getTemperatureStatus,
} from './signalSimulation';

const hiddenObservation = { visible: false, centrality: 0, dwellSeconds: 0 };
const focusedObservation = { visible: true, centrality: 1, dwellSeconds: 45 };

describe('SignalSimulation', () => {
  it('keeps temperature bounded with steps no larger than 0.2°C', () => {
    const simulation = new SignalSimulation(11, new Date(0));
    let previous = simulation.getSnapshot().values.temperature;
    for (let index = 0; index < 500; index += 1) {
      const current = simulation.tick(hiddenObservation, new Date(index + 1)).values.temperature;
      expect(current).toBeGreaterThanOrEqual(18);
      expect(current).toBeLessThanOrEqual(28);
      expect(Math.abs(current - previous)).toBeLessThanOrEqual(0.200_001);
      previous = current;
    }
  });

  it('keeps lighting bounded with normal steps no larger than 25 lux', () => {
    const simulation = new SignalSimulation(12, new Date(0));
    let previous = simulation.getSnapshot().values.lighting;
    for (let index = 0; index < 500; index += 1) {
      const current = simulation.tick(hiddenObservation, new Date(index + 1)).values.lighting;
      expect(current).toBeGreaterThanOrEqual(100);
      expect(current).toBeLessThanOrEqual(800);
      expect(Math.abs(current - previous)).toBeLessThanOrEqual(25);
      previous = current;
    }
  });

  it('keeps occupancy integer-valued, bounded and limited to one-person transitions', () => {
    const simulation = new SignalSimulation(13, new Date(0));
    let previous = simulation.getSnapshot().values.occupancy;
    let stableTicks = 0;
    for (let index = 0; index < 500; index += 1) {
      const current = simulation.tick(hiddenObservation, new Date(index + 1)).values.occupancy;
      expect(Number.isInteger(current)).toBe(true);
      expect(current).toBeGreaterThanOrEqual(0);
      expect(current).toBeLessThanOrEqual(6);
      expect(Math.abs(current - previous)).toBeLessThanOrEqual(1);
      if (current === previous) stableTicks += 1;
      previous = current;
    }
    expect(stableTicks).toBeGreaterThan(350);
  });

  it('keeps the selected non-essential appliance stable in the baseline', () => {
    const simulation = new SignalSimulation(14, new Date(0));
    for (let index = 0; index < 100; index += 1) {
      expect(simulation.tick(hiddenObservation, new Date(index + 1)).values.appliance).toBe('ON');
    }
  });

  it('bounds and smooths engagement while responding to interaction', () => {
    const focused = new SignalSimulation(15, new Date(0));
    const hidden = new SignalSimulation(15, new Date(0));
    let previous = focused.getSnapshot().values.engagement;
    for (let index = 0; index < 40; index += 1) {
      const value = focused.tick(focusedObservation, new Date(index + 1)).values.engagement;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
      expect(Math.abs(value - previous)).toBeLessThanOrEqual(4);
      previous = value;
      hidden.tick(hiddenObservation, new Date(index + 1));
    }
    expect(focused.getSnapshot().values.engagement).toBeGreaterThan(
      hidden.getSnapshot().values.engagement,
    );
  });

  it('is reproducible for a fixed seed and observation sequence', () => {
    const first = new SignalSimulation(2026, new Date(0));
    const second = new SignalSimulation(2026, new Date(0));
    for (let index = 0; index < 25; index += 1) {
      const observation = index % 2 === 0 ? focusedObservation : hiddenObservation;
      const time = new Date(index * 2_000);
      expect(first.tick(observation, time)).toEqual(second.tick(observation, time));
    }
  });

  it('pauses without advancing and resets values, tick and random sequence', () => {
    const simulation = new SignalSimulation(99, new Date(0));
    const advanced = simulation.tick(focusedObservation, new Date(2_000));
    simulation.pause();
    expect(simulation.tick(hiddenObservation, new Date(4_000))).toBe(advanced);
    expect(simulation.isPaused()).toBe(true);
    simulation.resume();
    expect(simulation.isPaused()).toBe(false);
    const reset = simulation.reset(new Date(6_000));
    expect(reset.values).toEqual(INITIAL_SIGNAL_VALUES);
    expect(reset.tick).toBe(0);
    expect(reset.mode).toEqual({ kind: 'scenario', scenarioId: 'normal' });
    expect(reset.updateReason).toBe('reset');
    expect(simulation.isPaused()).toBe(false);
  });
});

describe('signal statuses and formatting', () => {
  it('implements all documented status boundaries', () => {
    expect(getTemperatureStatus(19.9)).toBe('Cool');
    expect(getTemperatureStatus(20)).toBe('Comfortable');
    expect(getTemperatureStatus(24)).toBe('Comfortable');
    expect(getTemperatureStatus(24.1)).toBe('Warm');
    expect(getOccupancyStatus(0)).toBe('Vacant');
    expect(getOccupancyStatus(2)).toBe('Light use');
    expect(getOccupancyStatus(4)).toBe('Moderate use');
    expect(getOccupancyStatus(6)).toBe('Busy');
    expect(getLightingStatus(349)).toBe('Low');
    expect(getLightingStatus(350)).toBe('Adequate');
    expect(getLightingStatus(650)).toBe('Adequate');
    expect(getLightingStatus(651)).toBe('Bright');
    expect(getEngagementStatus(59)).toBe('Low');
    expect(getEngagementStatus(60)).toBe('Moderate');
    expect(getEngagementStatus(75)).toBe('Moderate');
    expect(getEngagementStatus(76)).toBe('High');
  });

  it('formats every signal with its intended value, unit and source', () => {
    const snapshot = createInitialSignalSnapshot(new Date(0));
    expect(formatSignal('temperature', snapshot)).toMatchObject({ value: '22.4', unit: '°C' });
    expect(formatSignal('occupancy', snapshot)).toMatchObject({ value: '2', unit: 'people' });
    expect(formatSignal('lighting', snapshot)).toMatchObject({ value: '430', unit: 'lux' });
    expect(formatSignal('appliance', snapshot)).toMatchObject({ value: 'ON', unit: '' });
    expect(formatSignal('appliance', snapshot).sourceDescription).toMatch(
      /communal countertop water boiler/i,
    );
    expect(formatSignal('engagement', snapshot)).toMatchObject({
      value: '68',
      unit: '/ 100',
      sourceBadge: 'Interaction-derived proxy',
    });
  });
});
