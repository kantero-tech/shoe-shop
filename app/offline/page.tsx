export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#F2F2F7]">
      <div className="w-20 h-20 rounded-full bg-[#E5E5EA] flex items-center justify-center mb-6">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8E8E93"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
      </div>
      <p className="text-[22px] font-bold text-[#1C1C1E] mb-2">You&apos;re offline</p>
      <p className="text-[15px] text-[#8E8E93]">Data will sync when you reconnect.</p>
    </div>
  )
}
