import { DEPARTMENTS, STRANDS, isBasicEducation, levelOptions, stageOf } from "../school"

export interface DepartmentValue {
    department?: string | null
    level?: number | string | null
    strand?: string | null
}

/**
 * Department, level and (for Senior High) strand, for the patient forms.
 * Renders three grid cells: department, level, and strand when it applies.
 * The level choices follow the department, and changing either clears a choice that no longer fits.
 */
export default function DepartmentFields({ value, onChange, inputClasses, labelClasses }: {
    value: DepartmentValue
    onChange: (patch: DepartmentValue) => void
    inputClasses: string
    labelClasses: string
}) {
    const department = value.department || ""
    const level = value.level === null || value.level === undefined ? "" : String(value.level)
    const groups = levelOptions(department)
    const validLevels = groups.flatMap(group => group.options.map(([n]) => String(n)))
    const showStrand = isBasicEducation(department) && stageOf(level) === "senior_high"
    // Records from before the list may hold another name; keep it visible until it is changed.
    const legacy = department && !DEPARTMENTS.includes(department) ? department : null

    function changeDepartment(next: string) {
        const nextLevels = levelOptions(next).flatMap(group => group.options.map(([n]) => String(n)))
        const keepLevel = nextLevels.includes(level)
        onChange({
            department: next,
            level: keepLevel ? value.level : "",
            strand: keepLevel && isBasicEducation(next) && stageOf(level) === "senior_high" ? value.strand : "",
        })
    }

    function changeLevel(next: string) {
        onChange({
            level: next === "" ? "" : Number(next),
            strand: isBasicEducation(department) && stageOf(next) === "senior_high" ? value.strand : "",
        })
    }

    return (
        <>
            <div>
                <label className={labelClasses} htmlFor="department">Department</label>
                <select id="department" value={department} onChange={(e) => changeDepartment(e.target.value)} className={inputClasses}>
                    <option value="">Choose a department</option>
                    {legacy && <option value={legacy}>{legacy} (old name)</option>}
                    {DEPARTMENTS.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
            </div>
            <div>
                <label className={labelClasses} htmlFor="level">{isBasicEducation(department) ? "Grade" : "Year level"}</label>
                <select
                    id="level"
                    value={validLevels.includes(level) ? level : ""}
                    onChange={(e) => changeLevel(e.target.value)}
                    disabled={!department || Boolean(legacy)}
                    className={inputClasses}
                >
                    <option value="">{department ? "Choose" : "Choose a department first"}</option>
                    {groups.map((group, idx) => group.group ? (
                        <optgroup key={group.group} label={group.group}>
                            {group.options.map(([n, label]) => <option key={n} value={String(n)}>{label}</option>)}
                        </optgroup>
                    ) : (
                        group.options.map(([n, label]) => <option key={`${idx}-${n}`} value={String(n)}>{label}</option>)
                    ))}
                </select>
            </div>
            {showStrand && (
                <div className="sm:col-span-3">
                    <label className={labelClasses} htmlFor="strand">Senior High strand</label>
                    <select id="strand" value={value.strand || ""} onChange={(e) => onChange({ strand: e.target.value })} className={inputClasses}>
                        <option value="">Choose a strand</option>
                        {STRANDS.map(strand => <option key={strand} value={strand}>{strand}</option>)}
                    </select>
                </div>
            )}
        </>
    )
}
