import { Trophy, Users, type LucideIcon } from 'lucide-react'

export interface ProgramItem {
  id: string
  icon: LucideIcon
  title: string
  description: string
  date: string
}

export const programs: ProgramItem[] = [
  {
    id: 'p1',
    icon: Trophy,
    title: 'AI Agent 해커톤 2026',
    description: 'Build AI-powered student support tools with teammates from across PNU.',
    date: '2026.07.18',
  },
  {
    id: 'p2',
    icon: Users,
    title: 'PNU 창업동아리 모집',
    description: 'Join startup clubs and meet peers interested in entrepreneurship.',
    date: '2026.07.25',
  },
  {
    id: 'p3',
    icon: Trophy,
    title: 'International Student Career Camp',
    description: 'Resume, interview, and networking sessions for international students.',
    date: '2026.08.02',
  },
]

export interface ScholarshipItem {
  id: string
  title: string
  deadline: string
  description: string
  eligibility: string
}

export const scholarships: ScholarshipItem[] = [
  {
    id: 's1',
    title: 'GKS Scholarship',
    deadline: 'D-7',
    description: 'Government scholarship opportunity for international students.',
    eligibility: 'International students with strong academic records.',
  },
  {
    id: 's2',
    title: '정보컴퓨터공학과 성적우수',
    deadline: 'D-21',
    description: 'Department merit scholarship for outstanding academic performance.',
    eligibility: 'Computer Science & Engineering students with high GPA.',
  },
  {
    id: 's3',
    title: 'International Student Support Scholarship',
    deadline: 'D-30',
    description: 'Need-based support for enrolled international students.',
    eligibility: 'International students who submit financial support documents.',
  },
]
