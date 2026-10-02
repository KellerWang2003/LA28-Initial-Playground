export function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex size-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  )
}
