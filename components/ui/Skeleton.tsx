interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={`animate-pulse bg-[#E8E6F5] rounded-2xl ${className || ''}`} />
}

export default Skeleton
