// Must match backend/roles.py. The server enforces roles; these only decide what the UI shows.
export const STAFF_ROLE_ID = 1
export const ADMIN_ROLE_ID = 4
export const STAFF_ROLE_NAME = "Staff"

export interface Role {
    staff_category_id: number
    category_name: string
}

export const ROLES: Role[] = [
    { staff_category_id: STAFF_ROLE_ID, category_name: STAFF_ROLE_NAME },
    { staff_category_id: 2, category_name: "Nurse" },
    { staff_category_id: 3, category_name: "Doctor" },
    { staff_category_id: ADMIN_ROLE_ID, category_name: "Admin" },
]
