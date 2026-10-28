// The school's departments and levels. Must match backend/school.py; a backend test checks it.
//
// Patients store `department` as the department's name and `level` as a number:
//   Basic Education: 0 = Kindergarten, 1-12 = Grade 1-12
//   Colleges:        1-5 = year level
// Senior High School students (Grades 11-12) also have a `strand`.

export const BASIC_EDUCATION = "Basic Education"

export const COLLEGES = [
  "College of Arts and Sciences",
  "College of Business",
  "College of Computer Studies",
  "College of Engineering",
  "College of Medicine",
  "College of Nursing",
  "College of Pharmacy",
] as const

export const DEPARTMENTS = [BASIC_EDUCATION, ...COLLEGES]

export const COLLEGE_YEARS = [1, 2, 3, 4, 5]

export type Stage = "elementary" | "junior_high" | "senior_high"

export const STAGES: Record<Stage, { label: string; short: string; levels: number[] }> = {
  elementary: { label: "Elementary", short: "Elem", levels: [0, 1, 2, 3, 4, 5, 6] },
  junior_high: { label: "Junior High School", short: "JHS", levels: [7, 8, 9, 10] },
  senior_high: { label: "Senior High School", short: "SHS", levels: [11, 12] },
}

export const STRANDS = ["STEM", "ABM", "HUMSS", "GAS", "TVL"]

export function isBasicEducation(department?: string | null) {
  return department === BASIC_EDUCATION
}

export function stageOf(level: number | string | null | undefined): Stage | null {
  const n = Number(level)
  if (level === null || level === undefined || level === "" || Number.isNaN(n)) return null
  return (Object.keys(STAGES) as Stage[]).find(key => STAGES[key].levels.includes(n)) ?? null
}

export function gradeName(level: number) {
  return level === 0 ? "Kindergarten" : `Grade ${level}`
}

function ordinal(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`
}

/** The level choices for a department, for a <select>. Basic Education is grouped by stage. */
export function levelOptions(department?: string | null): { group?: string; options: [number, string][] }[] {
  if (isBasicEducation(department)) {
    return (Object.values(STAGES)).map(stage => ({
      group: stage.label,
      options: stage.levels.map(level => [level, gradeName(level)] as [number, string]),
    }))
  }
  if (department) return [{ options: COLLEGE_YEARS.map(year => [year, `${ordinal(year)} year`] as [number, string]) }]
  return []
}

/**
 * The level in words, worked out from the department:
 * "Grade 8 · Junior High School", "Grade 11 · Senior High School · STEM", "2nd year".
 * `short` gives "G8 · JHS" / "2nd yr" for tight table cells.
 */
export function describeLevel(
  department?: string | null,
  level?: number | string | null,
  strand?: string | null,
  short = false,
) {
  if (level === null || level === undefined || level === "") return ""
  const n = Number(level)
  if (Number.isNaN(n)) return String(level)
  if (isBasicEducation(department)) {
    const stage = stageOf(n)
    const grade = short ? (n === 0 ? "K" : `G${n}`) : gradeName(n)
    const parts = [grade, stage ? (short ? STAGES[stage].short : STAGES[stage].label) : null]
    if (stage === "senior_high" && strand) parts.push(strand)
    return parts.filter(Boolean).join(" · ")
  }
  return short ? `${ordinal(n)} yr` : `${ordinal(n)} year`
}
