import { useEffect, useRef } from "react"
import { createJSONEditor } from "vanilla-jsoneditor"
import type { Content } from "vanilla-jsoneditor"
import { cn } from "@/lib/utils"

interface JsonEditorProps {
  content: Content
  onChange: (content: Content) => void
  dark?: boolean
  readOnly?: boolean
  className?: string
}

function JsonEditor({ content, onChange, dark, readOnly, className }: JsonEditorProps) {
  const container = useRef<HTMLDivElement>(null)
  const editor = useRef<ReturnType<typeof createJSONEditor> | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!container.current) return

    editor.current = createJSONEditor({
      target: container.current,
      props: {
        content,
        readOnly,
        mode: "text",
        mainMenuBar: false,
        navigationBar: false,
        statusBar: false,
        onChange(newContent: Content) {
          onChangeRef.current(newContent)
        },
      },
    })

    return () => {
      if (editor.current) {
        editor.current.destroy()
        editor.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!container.current) return
    container.current.classList.toggle("jse-theme-dark", !!dark)
  }, [dark])

  useEffect(() => {
    if (editor.current) {
      editor.current.updateProps({ content, readOnly })
    }
  }, [content, readOnly])

  return <div ref={container} className={cn("json-editor-theme", className)} />
}

export { JsonEditor }