import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { cn } from "@/utils"

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  invalid?: boolean
  label?: string
}

function normalizeUrl(rawValue: string): string | null {
  const trimmedValue = rawValue.trim()
  if (trimmedValue === "") {
    return null
  }
  if (/^(https?:\/\/|mailto:)/i.test(trimmedValue)) {
    return trimmedValue
  }
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(trimmedValue)) {
    return `https://${trimmedValue}`
  }
  return null
}

export function RichTextEditor(props: Readonly<RichTextEditorProps>) {
  const { value, onChange, placeholder, invalid, label } = props

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          codeBlock: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          code: false,
          strike: false,
          italic: false,
          horizontalRule: false,
          dropcursor: false,
          gapcursor: false,
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https",
            HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
          },
        }),
      ],
      content: value || "",
      editorProps: {
        attributes: {
          class:
            "tiptap min-h-44 max-w-none px-4 py-3 text-sm leading-6 text-gray-900 outline-none",
          "aria-label": label ?? "Cover letter body",
        },
      },
      onUpdate: ({ editor: updatedEditor }) => {
        onChange(updatedEditor.getHTML())
      },
    },
    [],
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }
    const currentHtml = editor.getHTML()
    if (currentHtml !== value && (value || currentHtml !== "<p></p>")) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-400">
        Loading editor…
      </div>
    )
  }

  const handleLinkClick = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const currentHref = editor.getAttributes("link").href ?? ""
    const enteredUrl = window.prompt("Link URL (https://…)", currentHref)
    if (enteredUrl === null) {
      return
    }
    const normalizedUrl = normalizeUrl(enteredUrl)
    if (normalizedUrl === null) {
      if (enteredUrl.trim() !== "") {
        window.alert("Enter a valid URL starting with https:// (or mailto:).")
      }
      return
    }
    editor.chain().focus().setLink({ href: normalizedUrl }).run()
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-white",
        invalid ? "border-red-400" : "border-gray-300 focus-within:border-gray-500",
      )}
    >
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => {
            editor.chain().focus().toggleBold().run()
          }}
          disabled={!editor.can().toggleBold()}
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => {
            editor.chain().focus().toggleUnderline().run()
          }}
          disabled={!editor.can().toggleUnderline()}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <span aria-hidden className="mx-1 h-5 w-px bg-gray-300" />
        <ToolbarButton
          label={editor.isActive("link") ? "Remove link" : "Add link"}
          active={editor.isActive("link")}
          onClick={handleLinkClick}
        >
          <span className="underline decoration-dotted underline-offset-2">Link</span>
        </ToolbarButton>
      </div>
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <p aria-hidden className="pointer-events-none absolute px-4 py-3 text-sm text-gray-400">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarButton(
  props: Readonly<{
    label: string
    active?: boolean
    disabled?: boolean
    onClick: () => void
    children: React.ReactNode
  }>,
) {
  const { label, active, disabled, onClick, children } = props
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-sm transition-colors",
        "text-gray-600 hover:bg-gray-200 hover:text-gray-900",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
        active && "bg-white text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-white",
      )}
    >
      {children}
    </button>
  )
}
