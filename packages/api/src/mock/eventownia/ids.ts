const randomPart = () => Math.random().toString(36).slice(2, 10);

export function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${randomPart()}`;
}

export function makePublicToken(prefix = "rtok") {
  return `${prefix}_${randomPart()}_${randomPart()}_${randomPart()}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function addHoursIso(input: string, hours: number) {
  return new Date(new Date(input).getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function dateTimeIso(date: string, time = "10:00") {
  return new Date(`${date}T${time}:00.000+02:00`).toISOString();
}

export function addMinutesIso(input: string, minutes: number) {
  return new Date(new Date(input).getTime() + minutes * 60 * 1000).toISOString();
}
