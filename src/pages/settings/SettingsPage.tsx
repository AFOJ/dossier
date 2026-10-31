import { useState, type ReactNode } from "react"
import { Controller } from "react-hook-form"
import { Tabs } from "@base-ui/react/tabs"
import { RadioGroup } from "@base-ui/react/radio-group"
import { Radio } from "@base-ui/react/radio"
import {
  Button,
  Field,
  FormSubmitBar,
  Heading1,
  Heading2,
  Input,
  Subheading,
} from "@/components/ui"
import { usePageTitle } from "@/hooks/usePageTitle"
import useProtectedRouteData from "@/hooks/useProtectedRouteData"
import { useSettings } from "@/hooks/useSettings"
import { SyncSwitch } from "@/pages/resumes/create/components/SyncSwitch"
import type { Settings } from "@/db/settings"
import { DocumentsFormSkeleton } from "./components/DocumentsFormSkeleton"
import { DataSection, DangerZone } from "./components/DataSettings"
import { useSettingsForm } from "./hooks/useSettingsForm"
import { renderTitle, TITLE_FORMAT_TOKENS } from "@/lib/titleFormat"
import { getExportFilenameWithSettings, getPdfFilenameWithSettings } from "@/lib/download"

const tabs = ["Documents", "Exports", "Data"] as const

export default function SettingsPage() {
  usePageTitle("Settings")
  const { settings, isLoaded } = useSettings()
  return (
    <section className="flex min-w-0 max-w-4xl [overflow-wrap:anywhere] flex-col gap-8 pb-24">
      <header className="flex flex-col gap-1">
        <Heading1>Settings</Heading1>
        <Subheading>Document defaults, downloads, and local data.</Subheading>
      </header>
      <span role="status" className="sr-only">
        {isLoaded ? "Settings loaded" : "Loading settings"}
      </span>
      {isLoaded ? <SettingsWorkspace settings={settings} /> : <DocumentsFormSkeleton />}
    </section>
  )
}

function SettingsWorkspace({ settings }: Readonly<{ settings: Settings }>) {
  const [activeTab, setActiveTab] = useState<string>("Documents")
  const { form, saveSettings } = useSettingsForm(settings)
  const onSubmit = form.handleSubmit(saveSettings, (errors) => {
    const group = errors.documents ? "documents" : "exports"
    const field = Object.keys(errors[group] ?? {})[0]
    setActiveTab(group === "documents" ? "Documents" : "Exports")
    if (group === "exports") {
      if (field === "defaultPdfFilenameFormat") {
        form.setValue("exports.pdfFilenamePattern", "shared", { shouldDirty: true })
      } else if (
        field === "defaultResumePdfFilenameFormat" ||
        field === "defaultCoverLetterPdfFilenameFormat"
      ) {
        form.setValue("exports.pdfFilenamePattern", "ad-hoc", { shouldDirty: true })
      }
    }
    if (field) {
      requestAnimationFrame(() => {
        form.setFocus(`${group}.${field}` as Parameters<typeof form.setFocus>[0])
      })
    }
  })
  const { profile } = useProtectedRouteData()
  const values = form.watch()
  const exportSettings = { exports: values.exports }
  const filename = (kind: "resume" | "cover-letter") =>
    getPdfFilenameWithSettings(kind, "My document", exportSettings)
  const exportFields =
    values.exports.pdfFilenamePattern === "shared"
      ? ([["defaultPdfFilenameFormat", "PDF filename", "resume"]] as const)
      : ([
          ["defaultResumePdfFilenameFormat", "Resume PDF filename", "resume"],
          ["defaultCoverLetterPdfFilenameFormat", "Cover letter PDF filename", "cover-letter"],
        ] as const)

  return (
    <form onSubmit={onSubmit} noValidate className="[&_input]:scroll-mb-24 [&_select]:scroll-mb-24">
      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(String(value))}>
        <Tabs.List
          activateOnFocus
          aria-label="Settings categories"
          className="mb-8 flex min-w-0 flex-nowrap gap-6 overflow-x-auto border-b border-gray-200 px-1 pt-1"
        >
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab}
              value={tab}
              className="relative min-h-11 shrink-0 cursor-pointer whitespace-nowrap border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-gray-500 hover:text-gray-900 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-600 data-active:border-gray-900 data-active:text-gray-950"
            >
              {tab}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value="Documents" keepMounted className="space-y-8 data-hidden:hidden">
          <SectionHeading title="Document defaults">
            Choose how new documents begin. Existing documents keep their current settings.
          </SectionHeading>
          <div className="flex flex-col gap-5 divide-y divide-gray-200">
            <div className="flex items-start justify-between gap-6 pb-5">
              <div>
                <p className="text-sm font-medium text-gray-950">
                  Sync new documents to my profile
                </p>
                <p className="mt-1 max-w-lg text-sm text-gray-600">
                  Keep contact details connected to your profile. Turn this off to use separate
                  details for each new document.
                </p>
              </div>
              <Controller
                control={form.control}
                name="documents.defaultSyncProfile"
                render={({ field }) => (
                  <SyncSwitch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label="Sync new documents to my profile"
                  />
                )}
              />
            </div>
            <div className="pt-5">
              <Field
                label="New resume title"
                inputId="resume-title-format"
                error={form.formState.errors.documents?.defaultResumeTitleFormat?.message}
                description={
                  <>
                    Currently produces:{" "}
                    <strong>
                      {renderTitle(values.documents.defaultResumeTitleFormat, { profile })}
                    </strong>
                  </>
                }
              >
                <Input
                  id="resume-title-format"
                  className="font-mono text-sm"
                  {...form.register("documents.defaultResumeTitleFormat")}
                />
              </Field>
              <TokenHelp tokens={TITLE_FORMAT_TOKENS} />
            </div>
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="Exports" keepMounted className="space-y-8 data-hidden:hidden">
          <SectionHeading title="File naming">
            Choose names for downloaded files. Your document content stays the same.
          </SectionHeading>
          <div>
            <Field
              label="Export filename format"
              inputId="json-filename-format"
              error={form.formState.errors.exports?.defaultExportFilenameFormat?.message}
              description={`Example: ${getExportFilenameWithSettings("resume", "My document", exportSettings)}`}
            >
              <Input
                id="json-filename-format"
                className="font-mono text-sm"
                {...form.register("exports.defaultExportFilenameFormat")}
              />
            </Field>
            <p className="mt-2 text-sm text-gray-600">
              Used for JSON document exports and backups.
            </p>
          </div>
          <div className="space-y-5 border-t border-gray-200 pt-6">
            <fieldset className="space-y-2">
              <legend id="pdf-pattern-label" className="text-sm font-medium">
                PDF filename pattern
              </legend>
              <Controller
                control={form.control}
                name="exports.pdfFilenamePattern"
                render={({ field }) => (
                  <RadioGroup
                    aria-labelledby="pdf-pattern-label"
                    aria-describedby="pdf-pattern-help"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-wrap gap-x-6 gap-y-3"
                  >
                    {(
                      [
                        ["ad-hoc", "Separate formats"],
                        ["shared", "Shared format"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-900"
                      >
                        <Radio.Root
                          value={value}
                          className="flex size-4 shrink-0 items-center justify-center rounded-full border border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 data-checked:border-gray-900"
                        >
                          <Radio.Indicator className="size-2 rounded-full bg-gray-900" />
                        </Radio.Root>
                        {label}
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
              <p id="pdf-pattern-help" className="text-sm text-gray-600">
                Use one format for both document types, or give each its own format.
              </p>
            </fieldset>
            {exportFields.map(([key, label, kind]) => (
              <Field
                key={key}
                label={label}
                inputId={key}
                error={form.formState.errors.exports?.[key]?.message}
                description={`Example: ${filename(kind)}`}
              >
                <Input
                  id={key}
                  className="font-mono text-sm"
                  {...form.register(`exports.${key}`)}
                />
              </Field>
            ))}
          </div>
          <div>
            <TokenHelp
              tokens={["title", "kind", "date", "dateShort", "year", "month", "monthShort", "day"]}
            />
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Token values use lowercase and hyphens. Invalid filename characters are removed and
              the file extension is added automatically.
            </p>
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="Data" keepMounted className="space-y-10 data-hidden:hidden">
          <DataSection />
          <DangerZone />
        </Tabs.Panel>
      </Tabs.Root>
      <FormSubmitBar>
        <Button
          type="button"
          intent="secondary"
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
          onClick={() => form.reset()}
        >
          Revert
        </Button>
        <Button type="submit" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </FormSubmitBar>
    </form>
  )
}

function SectionHeading({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <header>
      <Heading2>{title}</Heading2>
      <p className="mt-1 text-sm text-gray-600">{children}</p>
    </header>
  )
}

function TokenHelp({ tokens }: Readonly<{ tokens: readonly string[] }>) {
  return (
    <p className="mt-3 text-xs leading-loose text-gray-500">
      Tokens:{" "}
      {tokens.map((token, index) => (
        <span key={token}>
          {index > 0 && " "}
          <code className="inline-block rounded bg-gray-100 px-1.5 font-mono text-gray-600">{`{${token}}`}</code>
        </span>
      ))}
    </p>
  )
}
