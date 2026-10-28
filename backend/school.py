"""The school's departments and levels. app/school.ts mirrors this file; a test keeps them in step.

Patients store `department` as the department's name and `level` as a number:
  Basic Education: 0 = Kindergarten, 1-12 = Grade 1-12
  Colleges:        1-5 = year level
Senior High School students (Grades 11-12) also have a `strand`.
"""

BASIC_EDUCATION = "Basic Education"

COLLEGES = (
    "College of Arts and Sciences",
    "College of Business",
    "College of Computer Studies",
    "College of Engineering",
    "College of Medicine",
    "College of Nursing",
    "College of Pharmacy",
)

DEPARTMENTS = (BASIC_EDUCATION, *COLLEGES)

COLLEGE_YEARS = range(1, 6)
BASIC_EDUCATION_LEVELS = range(0, 13)

# Basic Education groups, by grade (0 is Kindergarten), following DepEd.
STAGES = {
    "elementary": ("Elementary", range(0, 7)),
    "junior_high": ("Junior High School", range(7, 11)),
    "senior_high": ("Senior High School", range(11, 13)),
}

STRANDS = ("STEM", "ABM", "HUMSS", "GAS", "TVL")

# Names found in older records, and the department they belong to now.
LEGACY_NAMES = {
    "BSIT": "College of Computer Studies",
    "College of Information Technology": "College of Computer Studies",
    "College of Industrial Engineering": "College of Engineering",
}


def stage_of(level):
    for key, (_, levels) in STAGES.items():
        if level in levels:
            return key
    return None


def level_problem(department, level, strand=None):
    """Why this department, level and strand do not fit together, or None if they do."""
    if department not in DEPARTMENTS:
        return f"Unknown department: {department}"
    if level in (None, ""):
        return "Choose a level"
    try:
        level = int(level)
    except (TypeError, ValueError):
        return "Level must be a number"
    if department == BASIC_EDUCATION:
        if level not in BASIC_EDUCATION_LEVELS:
            return "Basic Education levels are Kindergarten (0) and Grades 1 to 12"
        if strand and stage_of(level) != "senior_high":
            return "Only Senior High School students (Grades 11 and 12) have a strand"
    elif level not in COLLEGE_YEARS:
        return "College year levels are 1 to 5"
    elif strand:
        return "Only Senior High School students have a strand"
    if strand and strand not in STRANDS:
        return f"Unknown strand: {strand}"
    return None
