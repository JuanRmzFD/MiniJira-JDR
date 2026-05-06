import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { formatRelativeDate } from '@/shared/lib/utils'
import type { Comment } from '@/shared/types'

const MENTION_REGEX = /@[\w][\w\s]*/g

function highlightMentions(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  MENTION_REGEX.lastIndex = 0
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <span key={match.index} className="font-medium text-blue-600">
        {match[0]}
      </span>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts
}

interface Props {
  comments: Comment[]
}

export function CommentList({ comments }: Props) {
  if (comments.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        Sin comentarios todavía.
      </p>
    )
  }

  return (
    <ol className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-2.5">
          <Avatar className="h-6 w-6 shrink-0 mt-0.5">
            <AvatarFallback className="text-[10px]">
              {comment.author.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium">{comment.author.displayName}</span>
              <span className="text-xs text-muted-foreground">{formatRelativeDate(comment.createdAt)}</span>
            </div>
            <p className="text-sm leading-snug">{highlightMentions(comment.content)}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
