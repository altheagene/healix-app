import React from "react";
import Modal from "./modal";
import { telHref, visitDateParts } from "../visitOutcomes";

export function fullName(person: any) {
  return [person?.first_name, person?.middle_name, person?.last_name].filter(part => part && String(part).trim()).join(" ")
}

export function lastSignIn(value?: string | null) {
  if (!value) return "Never"
  const when = visitDateParts(value)
  return `${when.date}${when.time ? `, ${when.time}` : ""}`
}

export default function ViewStaff({ staff, onClose, onEdit }: { staff: any; onClose: () => void; onEdit?: () => void }) {
  const hidden = Boolean(staff.contact_hidden)
  const birthday = staff.birthday ? visitDateParts(staff.birthday).date : ""
  return (
    <Modal title={fullName(staff) || "Staff member"} onClose={onClose} width={460}>
      <div className="space-y-4 px-6 py-5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{staff.category_name}</span>
          {staff.is_active === 0 && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200/60">Switched off</span>
          )}
        </div>
        <dl className="m-0 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 text-slate-700">
          <dt className="font-medium text-slate-500">Phone</dt>
          <dd className="m-0">{hidden ? <Hidden /> : staff.phone ? <a href={telHref(staff.phone)} className="text-teal-800 hover:underline">{staff.phone}</a> : "-"}</dd>
          <dt className="font-medium text-slate-500">Email</dt>
          <dd className="m-0 break-all">{hidden ? <Hidden /> : staff.email ? <a href={`mailto:${staff.email}`} className="text-teal-800 hover:underline">{staff.email}</a> : "-"}</dd>
          {!hidden && (
            <>
              <dt className="font-medium text-slate-500">Birthday</dt>
              <dd className="m-0">{birthday || "-"}</dd>
              <dt className="font-medium text-slate-500">Sex</dt>
              <dd className="m-0 capitalize">{staff.sex || "-"}</dd>
              <dt className="font-medium text-slate-500">Username</dt>
              <dd className="m-0">{staff.username || "-"}</dd>
            </>
          )}
          {"last_login" in staff && (
            <>
              <dt className="font-medium text-slate-500">Last signed in</dt>
              <dd className="m-0">{lastSignIn(staff.last_login)}</dd>
            </>
          )}
        </dl>
        {hidden && <p className="m-0 text-xs text-slate-400">Only admins can see other staff members' contact details.</p>}
      </div>
      {onEdit && (
        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900">
            <i className="bi bi-pencil" aria-hidden="true" /> Edit
          </button>
        </div>
      )}
    </Modal>
  )
}

function Hidden() {
  return <span className="text-slate-400">Hidden</span>
}
