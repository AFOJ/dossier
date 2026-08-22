export interface Link {
  label: string
  url: string
}

export interface SkillGroup {
  title: string
  items: string[]
}

export interface EducationalInstitution {
  name: string
  degree: string
  grade?: string
  start_date: string
  end_date: string
  location: string
  paragraph?: string
}

export interface ExperienceCompanyRole {
  job_title: string
  employment_type?: string
  location?: string
  bullets: ExperienceCompanyRoleBullet[]
}

export type ExperienceCompanyRoleBullet =
  | { type: 'text'; text: string }
  | { type: 'text-with-title'; title: string; text: string }

export interface ExperienceCompany {
  company_name: string
  company_website?: string
  start_date: string
  end_date?: string
  roles: ExperienceCompanyRole[]
}

export type ResumeSection =
  | { type: 'summary'; text: string }
  | { type: 'education'; institutions: EducationalInstitution[] }
  | { type: 'skills'; groups: SkillGroup[] }
  | { type: 'experience'; companies: ExperienceCompany[] }
