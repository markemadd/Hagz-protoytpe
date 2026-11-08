/* Generates a minimal iCalendar (.ics) file so "Add to calendar" works in any calendar app (RFC 5545). */

/** "2026-11-12", 19.5 -> "20261112T173000Z" (Cairo is UTC+2 in November). */
function toUtcStamp(date: string, hour: number) {
  const [y, m, d] = date.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d, 0, 0) + (hour - 2) * 3_600_000;
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Build the .ics text and trigger a browser download. */
export function downloadIcs({ title, date, startHour, duration, location, description }: {
  title: string;
  date: string;
  startHour: number;
  duration: number;
  location: string;
  description: string;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kora//Prototype//EN",
    "BEGIN:VEVENT",
    `UID:${date}-${startHour}-${Math.random().toString(36).slice(2)}@kora.app`,
    `DTSTAMP:${toUtcStamp(date, startHour)}`,
    `DTSTART:${toUtcStamp(date, startHour)}`,
    `DTEND:${toUtcStamp(date, startHour + duration)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kora-game.ics";
  a.click();
  URL.revokeObjectURL(url);
}
