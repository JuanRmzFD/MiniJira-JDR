interface TagChipProps {
  label: string
}

export function TagChip({ label }: TagChipProps) {
  return (
    <span className="bg-ds-surface-variant text-ds-on-surface-variant text-body-sm rounded-full px-2 py-0.5">
      {label}
    </span>
  )
}
