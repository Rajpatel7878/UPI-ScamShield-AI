import { cn } from '../../utils/cn.js'

const COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
}

const GAPS = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
}

export function ResponsiveGrid({
  columns = 3,
  gap = 'md',
  as: Tag = 'div',
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'grid',
        COLUMNS[columns] ?? COLUMNS[3],
        GAPS[gap] ?? GAPS.md,
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
