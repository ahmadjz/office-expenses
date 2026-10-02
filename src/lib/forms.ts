import type { SafeParseReturnType } from 'zod'

export function firstErrors<Field extends string>(result: SafeParseReturnType<unknown, unknown>): Partial<Record<Field, string>> {
  if (result.success) return {}
  return result.error.issues.reduce<Partial<Record<Field, string>>>((errors, issue) => {
    const field = issue.path[0] as Field
    return errors[field] ? errors : { ...errors, [field]: issue.message }
  }, {})
}
