import { calculateInitialSchedules } from '../scheduleStrategy';

describe('scheduleStrategy', () => {
  it('should calculate initial schedules correctly without exceeding hourly limit', () => {
    const startTime = new Date('2026-08-30T10:00:00Z');
    const delayMs = 2000;
    const hourlyLimit = 100;
    const numberOfEmails = 3;

    const schedules = calculateInitialSchedules(startTime, delayMs, hourlyLimit, numberOfEmails);

    expect(schedules).toHaveLength(3);
    expect(schedules[0].toISOString()).toBe('2026-08-30T10:00:00.000Z');
    expect(schedules[1].toISOString()).toBe('2026-08-30T10:00:02.000Z');
    expect(schedules[2].toISOString()).toBe('2026-08-30T10:00:04.000Z');
  });

  it('should push emails to the next hour if hourly limit is reached', () => {
    const startTime = new Date('2026-08-30T10:00:00Z');
    const delayMs = 2000;
    const hourlyLimit = 2; // only 2 emails per hour
    const numberOfEmails = 3;

    const schedules = calculateInitialSchedules(startTime, delayMs, hourlyLimit, numberOfEmails);

    expect(schedules).toHaveLength(3);
    // 1st hour
    expect(schedules[0].toISOString()).toBe('2026-08-30T10:00:00.000Z');
    expect(schedules[1].toISOString()).toBe('2026-08-30T10:00:02.000Z');
    
    // 2nd hour (10:00:00 + 1 hour = 11:00:00)
    expect(schedules[2].toISOString()).toBe('2026-08-30T11:00:00.000Z');
  });
});
