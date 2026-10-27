// Shapes of rows the API returns. Keep in step with backend/db/schema.sql.

export interface Allergy {
  allergy_id: number
  allergy_name: string
}

export interface Condition {
  condition_id: number
  condition_name: string
}
