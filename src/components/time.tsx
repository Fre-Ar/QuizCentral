export type Time = {
    hours: number;
    minutes: number;
    seconds: number;
};

export function formatTime(time: Time): string {
    const { hours, minutes, seconds } = time;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function isValidTime(time: Time): boolean {
    const { hours, minutes, seconds } = time;
    return (
      hours >= 0 && hours < 24 &&
      minutes >= 0 && minutes < 60 &&
      seconds >= 0 && seconds < 60
    );
}