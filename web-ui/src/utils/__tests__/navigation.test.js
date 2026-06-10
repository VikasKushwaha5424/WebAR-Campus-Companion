import { describe, it, expect } from 'vitest';
import { calculateBearing, calculateDistance, computeTurnAngle, getDirectionLabel, getTurnIntensity } from '../navigation';

describe('calculateBearing', () => {
  it('returns 0 for due north', () => {
    const b = calculateBearing(0, 0, 1, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it('returns 90 for due east', () => {
    const b = calculateBearing(0, 0, 0, 1);
    expect(b).toBeCloseTo(90, 0);
  });

  it('returns 180 for due south', () => {
    const b = calculateBearing(0, 0, -1, 0);
    expect(b).toBeCloseTo(180, 0);
  });

  it('returns 270 for due west', () => {
    const b = calculateBearing(0, 0, 0, -1);
    expect(b).toBeCloseTo(270, 0);
  });

  it('normalizes to 0-360 range', () => {
    const b = calculateBearing(0, 0, -1, 0);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('calculateDistance', () => {
  it('returns ~111km for 1 degree latitude', () => {
    const d = calculateDistance(0, 0, 1, 0);
    expect(d).toBeCloseTo(111195, -3);
  });

  it('returns 0 for same point', () => {
    const d = calculateDistance(10, 20, 10, 20);
    expect(d).toBe(0);
  });

  it('distance is symmetric', () => {
    const d1 = calculateDistance(0, 0, 1, 1);
    const d2 = calculateDistance(1, 1, 0, 0);
    expect(d1).toBeCloseTo(d2, 0);
  });
});

describe('computeTurnAngle', () => {
  it('returns positive for right turn', () => {
    const angle = computeTurnAngle(
      0, 0,   // prev: origin
      1, 0,   // curr: north of prev
      1, 1    // next: east of curr = right turn
    );
    expect(angle).toBeGreaterThan(0);
  });

  it('returns negative for left turn', () => {
    const angle = computeTurnAngle(
      0, 0,   // prev: origin
      0, 1,   // curr: east of prev (bearing 90)
      1, 1    // next: north of curr (bearing 0) = left turn
    );
    expect(angle).toBeLessThan(0);
  });

  it('returns ~0 for straight', () => {
    const angle = computeTurnAngle(
      0, 0,
      0, 1,
      0, 2
    );
    expect(Math.abs(angle)).toBeLessThan(5);
  });

  it('returns ~180 for uturn', () => {
    const angle = computeTurnAngle(
      0, 0,
      0, 1,
      0, 0
    );
    expect(Math.abs(angle)).toBeGreaterThan(170);
  });
});

describe('getDirectionLabel', () => {
  it('returns Turn Right for >30', () => {
    expect(getDirectionLabel(45)).toBe('Turn Right');
    expect(getDirectionLabel(90)).toBe('Turn Right');
    expect(getDirectionLabel(180)).toBe('Turn Around');
  });

  it('returns Turn Left for <-30', () => {
    expect(getDirectionLabel(-45)).toBe('Turn Left');
    expect(getDirectionLabel(-90)).toBe('Turn Left');
    expect(getDirectionLabel(-180)).toBe('Turn Around');
  });

  it('returns Go Straight for small angles', () => {
    expect(getDirectionLabel(0)).toBe('Go Straight');
    expect(getDirectionLabel(15)).toBe('Go Straight');
    expect(getDirectionLabel(-15)).toBe('Go Straight');
  });

  it('returns Turn Around for extreme angles', () => {
    expect(getDirectionLabel(160)).toBe('Turn Around');
    expect(getDirectionLabel(-160)).toBe('Turn Around');
  });
});

describe('getTurnIntensity', () => {
  it('returns sharp for >120', () => {
    expect(getTurnIntensity(150)).toBe('sharp');
    expect(getTurnIntensity(-150)).toBe('sharp');
  });

  it('returns moderate for 60-120', () => {
    expect(getTurnIntensity(90)).toBe('moderate');
    expect(getTurnIntensity(-90)).toBe('moderate');
  });

  it('returns gentle for 30-60', () => {
    expect(getTurnIntensity(45)).toBe('gentle');
    expect(getTurnIntensity(-45)).toBe('gentle');
  });

  it('returns straight for <30', () => {
    expect(getTurnIntensity(0)).toBe('straight');
    expect(getTurnIntensity(15)).toBe('straight');
  });
});
