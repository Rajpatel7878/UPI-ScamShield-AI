/** Joins truthy class names. Keeps conditional styling readable without a dependency. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
