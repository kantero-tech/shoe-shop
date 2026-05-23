export default function Spinner() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '40vh' }}>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{
          borderColor: 'var(--color-fill-tertiary)',
          borderTopColor: 'var(--color-blue)',
        }}
      />
    </div>
  )
}
