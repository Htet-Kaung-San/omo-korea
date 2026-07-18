/** Demo letter grades / GPA for Courses UI until backend provides real grades. */

const LETTERS = ['A+', 'A', 'A-', 'B+', 'B', 'B+', 'A', 'A-'] as const
const SCORES = [98, 95, 90, 88, 85, 87, 94, 91] as const

function hashId(id: number): number {
  let n = Math.abs(id) || 1
  n = ((n * 2654435761) >>> 0) % 1000
  return n
}

export function demoLetterGrade(courseId: number): { letter: string; score: number } {
  const h = hashId(courseId)
  const idx = h % LETTERS.length
  return { letter: LETTERS[idx], score: SCORES[idx] }
}

export function demoGpa(courseIds: number[]): string {
  if (courseIds.length === 0) return '—'
  const points: Record<string, number> = {
    'A+': 4.5,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
  }
  const total = courseIds.reduce((sum, id) => {
    const { letter } = demoLetterGrade(id)
    return sum + (points[letter] ?? 3.5)
  }, 0)
  return (total / courseIds.length).toFixed(2)
}

export function gradeTone(letter: string): { ring: string; text: string; bg: string } {
  if (letter.startsWith('A')) {
    return { ring: 'ring-[#34C759]/30', text: 'text-[#248A3D]', bg: 'bg-[#E8F8ED]' }
  }
  if (letter.startsWith('B')) {
    return { ring: 'ring-pnu-blue/30', text: 'text-pnu-blue', bg: 'bg-pnu-blue/10' }
  }
  return { ring: 'ring-[#FF9500]/30', text: 'text-[#C77700]', bg: 'bg-[#FFF4E5]' }
}
