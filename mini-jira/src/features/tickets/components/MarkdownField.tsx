import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Textarea } from '@/shared/components/ui/textarea'

interface MarkdownFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MarkdownField({ value, onChange, placeholder, disabled }: MarkdownFieldProps) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'edit' | 'preview')}>
      <TabsList className="h-8">
        <TabsTrigger value="edit" className="text-xs">Editar</TabsTrigger>
        <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="mt-1">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'Descripción en Markdown...'}
          disabled={disabled}
          className="min-h-[140px] font-mono text-sm resize-y"
        />
      </TabsContent>
      <TabsContent value="preview" className="mt-1">
        <div className="min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm">
          {value ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <span className="text-muted-foreground italic">Sin contenido.</span>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
