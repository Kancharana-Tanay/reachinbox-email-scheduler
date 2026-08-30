export const calculateInitialSchedules = (
  startTime: Date,
  delayMs: number,
  hourlyLimit: number,
  numberOfEmails: number
): Date[] => {
  const schedules: Date[] = [];
  let currentBaseTime = startTime.getTime();
  const ONE_HOUR = 60 * 60 * 1000;

  for (let i = 0; i < numberOfEmails; i++) {
    // Calculate which hour bucket this email falls into
    const hourBucket = Math.floor(i / hourlyLimit);
    const indexInBucket = i % hourlyLimit;

    // The start time for this specific hour bucket
    const bucketStartTime = currentBaseTime + hourBucket * ONE_HOUR;

    // The specific time for this email within the bucket based on the delay
    const scheduledTime = bucketStartTime + indexInBucket * delayMs;

    schedules.push(new Date(scheduledTime));
  }

  return schedules;
};
