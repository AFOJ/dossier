import { ProjectFields } from "./ProjectFields"
import type { ResumeProject } from "@/db/types"
import { Button } from "@/components/ui"
import { AddItemButton } from "@/pages/resumes/create/components/SectionCard"
import type { UseFormClearErrors } from "react-hook-form"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import {
  getSectionErrors,
  useResumeFieldContext,
  itemKey,
  replaceKeyed,
  withKey,
  type ProjectsSectionErrors,
  type ResumeFormData,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"
import { HugeiconsIcon } from "@hugeicons/react"
import { DragDropHorizontalIcon, ArrowDownIcon, Trash } from "@hugeicons/core-free-icons"
import { useState, useEffect, useRef, memo } from "react"
import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { useFocusLastRow } from "@/hooks/useFocusLastRow"
import { cn } from "@/utils"

type ProjectItem = ResumeProject

type SortableProjectCardProps = {
  id: string
  label: string
  hasErrors: boolean
  onRemove: () => void
  children: React.ReactNode
}

function SortableProjectCard(props: Readonly<SortableProjectCardProps>) {
  const { id, label, hasErrors, onRemove, children } = props

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const [bodyId] = useState(() => `project-body-${crypto.randomUUID()}`)
  const [isOpen, setIsOpen] = useState(true)

  const [prevHasErrors, setPrevHasErrors] = useState(hasErrors)
  if (prevHasErrors !== hasErrors) {
    setPrevHasErrors(hasErrors)
    if (hasErrors) {
      setIsOpen(true)
    }
  }

  return (
    <div
      ref={setNodeRef}
      data-row=""
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-col rounded-[10px] border border-gray-200 bg-white",
        hasErrors && "border-red-300",
        isDragging && "relative z-10 opacity-50 shadow-md ring-1 ring-gray-300",
      )}
    >
      <div className="flex items-center gap-2 p-3 pb-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Reorder ${label} project`}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
            "text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
            "focus:outline-none focus:ring-1 focus:ring-gray-600",
            "cursor-grab touch-none active:cursor-grabbing",
          )}
        >
          <HugeiconsIcon icon={DragDropHorizontalIcon} aria-hidden size={16} />
        </button>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{label}</span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            intent="secondary"
            iconClassname="text-gray-500 hover:text-red-500"
            icon={Trash}
            onClick={onRemove}
            aria-label={`Remove ${label} project`}
            className="w-9 px-0"
          />
          <Button
            type="button"
            intent="secondary"
            icon={ArrowDownIcon}
            iconClassname={cn("transition-transform duration-200", isOpen && "rotate-180")}
            onClick={() => setIsOpen((open) => !open)}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${label} project`}
            aria-expanded={isOpen}
            aria-controls={bodyId}
            className="w-9 px-0"
          />
        </div>
      </div>

      <div id={bodyId} hidden={!isOpen} className="flex flex-col gap-3 px-3 pb-3">
        {children}
      </div>
    </div>
  )
}

type ProjectRowProps = {
  sectionIndex: number
  project: ProjectItem
  index: number
  onChange: (project: ProjectItem) => void
  onRemove: () => void
}

function ProjectRowImpl(props: Readonly<ProjectRowProps>) {
  const { sectionIndex, project, index, onChange, onRemove } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as ProjectsSectionErrors | undefined
  const projectErrors = sectionErrors?.projects?.[index]
  const hasErrors = projectErrors !== undefined

  const label = project.name?.trim() || `Untitled Project`

  return (
    <SortableProjectCard
      id={itemKey(project, index)}
      label={label}
      hasErrors={hasErrors}
      onRemove={onRemove}
    >
      <ProjectFields
        project={project}
        index={index}
        sectionIndex={sectionIndex}
        onChange={onChange}
      />
    </SortableProjectCard>
  )
}

const ProjectRow = memo(ProjectRowImpl)

type ProjectsEditorProps = {
  sectionIndex: number
  projects: ProjectItem[]
  onChange: (projects: ProjectItem[]) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function ProjectsEditor(props: Readonly<ProjectsEditorProps>) {
  const { sectionIndex, projects, onChange, clearErrors } = props

  const {
    formState: { errors, isSubmitted },
    trigger,
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as ProjectsSectionErrors | undefined
  const sectionError = sectionErrors?.projects?.message
  const projectsPath = `sections.${sectionIndex}.projects` as const
  const projectOrder = JSON.stringify(
    projects.map((project, projectIndex) => itemKey(project, projectIndex)),
  )
  const previousProjectOrder = useRef(projectOrder)

  useEffect(() => {
    if (previousProjectOrder.current === projectOrder) return
    previousProjectOrder.current = projectOrder
    const needsValidation = isSubmitted || sectionErrors?.projects !== undefined
    clearErrors(projectsPath)
    if (needsValidation) void trigger(projectsPath)
  }, [projectOrder, projectsPath, clearErrors, trigger, isSubmitted, sectionErrors])

  const containerRef = useFocusLastRow(projects.length)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) =>
    projects.findIndex((project, projectIndex) => itemKey(project, projectIndex) === id)

  const describe = (id: UniqueIdentifier): string => {
    const key = String(id)
    const index = findIndexById(key)
    if (index < 0) return "project"
    const project = projects[index]
    return project.name?.trim() || "Untitled Project"
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        onChange(arrayMove(projects, fromIndex, targetIndex))
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            `Grabbed ${describe(active.id)}. Use arrow keys to move it, then press Space to drop.`,
          onDragOver: ({ active, over }) =>
            over
              ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${projects.length}`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
          onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext
        items={projects.map((project, projectIndex) => itemKey(project, projectIndex))}
        strategy={verticalListSortingStrategy}
      >
        <div ref={containerRef} className="flex flex-col gap-3">
          {sectionError && (
            <p role="alert" className="text-sm text-red-700">
              {sectionError}
            </p>
          )}

          {projects.map((project, index) => (
            <ProjectRow
              key={itemKey(project, index)}
              sectionIndex={sectionIndex}
              project={project}
              index={index}
              onChange={(next) => onChange(replaceKeyed(projects, index, next))}
              onRemove={() => {
                onChange(projects.filter((_, projectIndex) => projectIndex !== index))
              }}
            />
          ))}

          <AddItemButton
            label="Add project"
            onAdd={() => {
              const project = withKey({ name: "", technologies: [], bullets: [] })
              onChange([...projects, project])
            }}
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
