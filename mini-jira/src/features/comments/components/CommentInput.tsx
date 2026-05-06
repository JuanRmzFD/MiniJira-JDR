import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAddComment } from '@/features/comments/hooks/useAddComment'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import type { User } from '@/shared/types'

interface Props {
  ticketId: string
  users: User[]
}

export function CommentInput({ ticketId, users }: Props) {
  const [content, setContent] = useState('')
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()
  const { mutate: addComment, isPending } = useAddComment(ticketId)

  const activeUsers = users.filter((u) => u.isActive)

  const handleChange = (value: string) => {
    setContent(value)

    const textarea = textareaRef.current
    if (!textarea) return

    const cursor = textarea.selectionStart
    const textBefore = value.slice(0, cursor)
    const mentionMatch = /@(\w*)$/.exec(textBefore)

    if (mentionMatch) {
      setMention({ query: mentionMatch[1], start: cursor - mentionMatch[0].length })
    } else {
      setMention(null)
    }
  }

  const selectMention = (user: User) => {
    if (!mention) return
    const before = content.slice(0, mention.start)
    const after = content.slice(textareaRef.current?.selectionStart ?? mention.start)
    setContent(`${before}@${user.displayName} ${after}`)
    setMention(null)
    textareaRef.current?.focus()
  }

  const handleSubmit = () => {
    const trimmed = content.trim()
    if (!trimmed) return
    addComment(trimmed, {
      onSuccess: () => {
        setContent('')
        setMention(null)
        queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
      },
    })
  }

  const filteredUsers = mention
    ? activeUsers.filter((u) =>
        u.displayName.toLowerCase().startsWith(mention.query.toLowerCase()),
      )
    : []

  return (
    <div className="relative space-y-2">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setMention(null)
        }}
        placeholder="Escribe un comentario... (usa @nombre para mencionar)"
        className="min-h-[80px] resize-y text-sm"
        disabled={isPending}
      />

      {mention && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-56 rounded-md border bg-popover shadow-md">
          {filteredUsers.slice(0, 5).map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectMention(user)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {user.displayName.slice(0, 2).toUpperCase()}
              </span>
              {user.displayName}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isPending}
        >
          {isPending ? 'Enviando...' : 'Comentar'}
        </Button>
      </div>
    </div>
  )
}
