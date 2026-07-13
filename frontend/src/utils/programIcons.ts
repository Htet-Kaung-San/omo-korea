import { Trophy, Users, type LucideIcon } from 'lucide-react'
import type { ProgramItem } from '@/types/api'

export function getProgramIcon(category?: string): LucideIcon {
  if (category?.toLowerCase().includes('club')) {
    return Users
  }
  return Trophy
}

export function getProgramIconForItem(program: ProgramItem): LucideIcon {
  return getProgramIcon(program.category)
}
