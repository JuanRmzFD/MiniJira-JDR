import { useComments } from '@/features/comments/hooks/useComments'
import { CommentList } from '@/features/comments/components/CommentList'
import { CommentInput } from '@/features/comments/components/CommentInput'
import { useUsers } from '@/features/admin/hooks/useUsers'

interface Props {
  ticketId: string
  isArchived: boolean
}

export function CommentSection({ ticketId, isArchived }: Props) {
  const { data: comments = [] } = useComments(ticketId)
  const { data: users = [] } = useUsers()

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Comentarios ({comments.length})
      </h4>
      <CommentList comments={comments} />
      {!isArchived && <CommentInput ticketId={ticketId} users={users} />}
    </div>
  )
}
