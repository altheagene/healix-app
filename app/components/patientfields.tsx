import DepartmentFields from "./departmentfields"
import { ChoiceGroup, Field, Section, inputClass, textareaClass } from "./form"
import TagPicker, { type TagOption } from "./tagpicker"
import { isBasicEducation, stageOf } from "../school"

const LABEL = "mb-1.5 block text-xs font-semibold text-sage-700"

/** What every patient needs before saving; returns the names of what is missing. */
export function missingPatientFields(data: Record<string, any>, isStudent: boolean) {
    const required: [string, string][] = [
        ["first_name", "first name"], ["last_name", "last name"], ["birthday", "birthday"], ["sex", "sex"],
        ...(isStudent ? [["student_id", "student ID"], ["department", "department"], ["level", "grade or year"]] as [string, string][] : []),
        ["emergency_contact_name", "emergency contact name"], ["emergency_contact_phone", "emergency contact phone"],
    ]
    const missing = required.filter(([key]) => data[key] === undefined || data[key] === null || String(data[key]).trim() === "")
        .map(([, name]) => name)
    if (isStudent && isBasicEducation(data.department) && stageOf(data.level) === "senior_high" && !data.strand) {
        missing.push("Senior High strand")
    }
    return missing
}

/** Personal, school, medical and emergency-contact sections, shared by Add and Edit patient. */
export default function PatientFields({ data, onChange, isStudent, allergies, conditions }: {
    data: Record<string, any>
    onChange: (patch: Record<string, any>) => void
    isStudent: boolean
    allergies: { options: TagOption[]; selected: number[]; onChange: (ids: number[]) => void; onCreate: (name: string) => Promise<number | null> }
    conditions: { options: TagOption[]; selected: number[]; onChange: (ids: number[]) => void; onCreate: (name: string) => Promise<number | null> }
}) {
    const value = (key: string) => data?.[key] ?? ""
    const sex = String(data?.sex || "").toLowerCase()
    return (
        <>
            <Section title={isStudent ? "Student" : "Personal details"} columns={3}>
                <Field label="First name" htmlFor="patient-first" required>
                    <input id="patient-first" className={inputClass} value={value("first_name")} onChange={(e) => onChange({ first_name: e.target.value })} />
                </Field>
                <Field label="Middle name" htmlFor="patient-middle" optional>
                    <input id="patient-middle" className={inputClass} value={value("middle_name")} onChange={(e) => onChange({ middle_name: e.target.value })} />
                </Field>
                <Field label="Last name" htmlFor="patient-last" required>
                    <input id="patient-last" className={inputClass} value={value("last_name")} onChange={(e) => onChange({ last_name: e.target.value })} />
                </Field>
                <Field label="Birthday" htmlFor="patient-birthday" required>
                    <input id="patient-birthday" type="date" className={inputClass} value={String(value("birthday")).slice(0, 10)}
                        onChange={(e) => onChange({ birthday: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                    <ChoiceGroup legend="Sex" name="patient-sex" required value={sex === "female" ? "Female" : sex === "male" ? "Male" : ""}
                        options={[["Female", "Female"], ["Male", "Male"]] as const} onChange={(next) => onChange({ sex: next })} />
                </div>
            </Section>

            {isStudent && (
                <Section title="School" columns={3}>
                    <Field label="Student ID" htmlFor="patient-student-id" required>
                        <input id="patient-student-id" inputMode="numeric" className={inputClass} value={value("student_id")}
                            onChange={(e) => onChange({ student_id: e.target.value })} />
                    </Field>
                    <DepartmentFields value={data || {}} onChange={onChange} inputClasses={inputClass} labelClasses={LABEL} />
                </Section>
            )}

            <Section title="Contact">
                <Field label="Email" htmlFor="patient-email" optional>
                    <input id="patient-email" type="email" className={inputClass} value={value("email")} onChange={(e) => onChange({ email: e.target.value })} />
                </Field>
                <Field label="Phone" htmlFor="patient-phone" optional>
                    <input id="patient-phone" type="tel" className={inputClass} value={value("phone")} placeholder="0917 123 4567"
                        onChange={(e) => onChange({ phone: e.target.value })} />
                </Field>
            </Section>

            <Section title="Emergency contact" description="Who the clinic calls when a student is sent home or referred.">
                <Field label="Full name" htmlFor="patient-ec-name" required>
                    <input id="patient-ec-name" className={inputClass} value={value("emergency_contact_name")} placeholder="e.g. Maria Santos (mother)"
                        onChange={(e) => onChange({ emergency_contact_name: e.target.value })} />
                </Field>
                <Field label="Phone" htmlFor="patient-ec-phone" required>
                    <input id="patient-ec-phone" type="tel" className={inputClass} value={value("emergency_contact_phone")} placeholder="0917 123 4567"
                        onChange={(e) => onChange({ emergency_contact_phone: e.target.value })} />
                </Field>
            </Section>

            <Section title="Medical">
                <TagPicker id="patient-allergies" label="Allergies" tone="red" options={allergies.options} selected={allergies.selected}
                    onChange={allergies.onChange} onCreate={allergies.onCreate} />
                <TagPicker id="patient-conditions" label="Conditions" options={conditions.options} selected={conditions.selected}
                    onChange={conditions.onChange} onCreate={conditions.onCreate} />
                <Field label="Notes" htmlFor="patient-notes" optional className="sm:col-span-2">
                    <textarea id="patient-notes" rows={3} className={textareaClass} value={value("notes")}
                        placeholder="e.g. Carries an inhaler; prefers liquid medicine"
                        onChange={(e) => onChange({ notes: e.target.value })} />
                </Field>
            </Section>
        </>
    )
}
