// Edit this file to match your school's actual schedule.
// Times are in 24-hour format (HH:MM).

export const SCHEDULE = [
  { grade: 'Grade 3', start: '08:30', end: '09:15' },
  { grade: 'Grade 4', start: '09:15', end: '10:00' },
  { grade: 'Grade 5', start: '10:15', end: '11:00' },
  { grade: 'Grade 6', start: '11:00', end: '11:45' },
  { grade: 'Grade 7', start: '12:30', end: '13:15' },
  { grade: 'Grade 8', start: '13:15', end: '14:00' },
]

// Returns the active slot for a given Date, or null
export function getActiveSlot(now = new Date()) {
  const h = now.getHours()
  const m = now.getMinutes()
  const cur = h * 60 + m

  return SCHEDULE.find(slot => {
    const [sh, sm] = slot.start.split(':').map(Number)
    const [eh, em] = slot.end.split(':').map(Number)
    return cur >= sh * 60 + sm && cur < eh * 60 + em
  }) ?? null
}

// Returns the next upcoming slot, or null if the day is done
export function getNextSlot(now = new Date()) {
  const h = now.getHours()
  const m = now.getMinutes()
  const cur = h * 60 + m

  return SCHEDULE.find(slot => {
    const [sh, sm] = slot.start.split(':').map(Number)
    return sh * 60 + sm > cur
  }) ?? null
}
