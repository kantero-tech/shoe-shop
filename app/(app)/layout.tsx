import { BottomNav } from '@/components/ui/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {children}
      <BottomNav />
    </div>
  )
}
