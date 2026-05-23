interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={`animate-pulse bg-[#E5E5EA] rounded-2xl ${className || ''}`} />
}

export default Skeleton
