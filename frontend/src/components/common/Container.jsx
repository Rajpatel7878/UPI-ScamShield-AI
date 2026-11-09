import { cn } from '../../utils/cn.js'

const SIZES = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
}

export function Container({ as: Tag = 'div', size = 'lg', className, children, ...props }) {
  return (
    <Tag className={cn('mx-auto w-full px-5 sm:px-8', SIZES[size], className)} {...props}>
      {children}
    </Tag>
  )
}
