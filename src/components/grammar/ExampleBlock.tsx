interface ExampleBlockProps {
  danish: string
  english: string
}

export function ExampleBlock({ danish, english }: ExampleBlockProps) {
  return (
    <div className="rounded-md bg-muted px-4 py-3 space-y-1">
      <p className="font-medium text-sm">{danish}</p>
      <p className="text-sm text-muted-foreground italic">{english}</p>
    </div>
  )
}
