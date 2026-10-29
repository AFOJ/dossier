import { useLayoutEffect, useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui"
import { cn } from "@/utils"
import { FormProvider } from "react-hook-form"
import { usePageTitle } from "@/hooks/usePageTitle"
import { RestoreFromExport } from "./components/RestoreFromExport"
import { FeatureCarousel } from "./components/FeatureCarousel"
import { SetupProfileFields } from "./components/SetupProfileFields"
import { useCreateProfileForm } from "./hooks/useCreateProfileForm"

const stepTitles = ["About you", "Contact details", "Your links"]

export default function CreateProfilePage() {
  const { form, isSubmitting, onSubmit, formError } = useCreateProfileForm()
  const [step, setStep] = useState(-1)
  const previousStep = useRef(step)
  const formRef = useRef<HTMLFormElement>(null)
  const setupButtonRef = useRef<HTMLButtonElement>(null)
  usePageTitle(
    step < 0 ? "Create Profile" : `Step ${step + 1} of 3: ${stepTitles[step]} – Create profile`,
  )
  useLayoutEffect(() => {
    if (previousStep.current === step) return
    previousStep.current = step
    if (step < 0) {
      setupButtonRef.current?.focus()
      return
    }
    const firstInput = formRef.current?.querySelector<HTMLInputElement>(
      'input:not([disabled]):not([type="hidden"])',
    )
    const firstButton = formRef.current?.querySelector<HTMLButtonElement>("button:not([disabled])")
    const focusTarget = firstInput ?? firstButton
    focusTarget?.focus()
  }, [step])

  const advance = async () => {
    const valid = await form.trigger(
      step === 0 ? ["fullName", "jobTitle"] : ["location", "email", "phone"],
      { shouldFocus: true },
    )
    if (valid) setStep(step + 1)
  }
  const submitStep = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    if (step < 2) {
      await advance()
      return
    }
    if (!(await form.trigger(undefined, { shouldFocus: true }))) {
      if (form.getFieldState("fullName").invalid || form.getFieldState("jobTitle").invalid)
        setStep(0)
      else if (
        form.getFieldState("email").invalid ||
        form.getFieldState("location").invalid ||
        form.getFieldState("phone").invalid
      )
        setStep(1)
      return
    }
    await onSubmit(event)
  }

  return (
    <main className="flex min-h-dvh flex-col p-4 sm:p-5">
      <p role="status" aria-atomic="true" className="sr-only">
        {step >= 0
          ? `Step ${step + 1} of 3: ${stepTitles[step]}${step > 0 ? ". Optional." : "."}`
          : ""}
      </p>
      {step === -1 ? (
        <div className="grid flex-1 gap-6 lg:grid-cols-2">
          <section className="flex min-w-0 flex-col px-2 py-2 sm:px-8 sm:py-3">
            <div className="hidden items-center gap-2 self-start lg:flex" aria-label="Dossier">
              <img src="/d-logo.svg" alt="" className="size-8" />
              <span className="font-heading text-xl font-bold text-gray-950">Dossier</span>
            </div>
            <div className="flex flex-1 items-center justify-center py-16">
              <div className="w-full max-w-sm">
                <img src="/d-logo.svg" alt="Dossier" className="mx-auto mb-6 size-16 lg:hidden" />
                <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-gray-950">
                  Set up your Dossier profile
                </h1>
                <div className="flex flex-col gap-3">
                  <Button
                    ref={setupButtonRef}
                    className="h-11 w-full whitespace-normal"
                    onClick={() => setStep(0)}
                  >
                    Create my profile
                  </Button>
                  <RestoreFromExport compact />
                </div>
              </div>
            </div>
          </section>
          <FeatureCarousel />
        </div>
      ) : (
        <>
          <div className="hidden px-2 py-2 sm:px-8 sm:py-3 lg:block">
            <div className="hidden items-center gap-2 self-start lg:flex" aria-label="Dossier">
              <img src="/d-logo.svg" alt="" className="size-8" />
              <span className="font-heading text-xl font-bold text-gray-950">Dossier</span>
            </div>
          </div>
          <section
            className={cn(
              "mx-auto flex w-full flex-1 flex-col justify-center px-2 py-12",
              step === 2 ? "max-w-2xl" : "max-w-md",
            )}
          >
            <img src="/d-logo.svg" alt="Dossier" className="mb-8 size-16 self-center lg:hidden" />
            <p id="setup-step-progress" className="mb-3 text-sm text-gray-500">
              Step {step + 1} of 3
            </p>
            <h1
              aria-describedby="setup-step-progress setup-step-help"
              className="text-3xl font-semibold tracking-tight text-gray-950"
            >
              {stepTitles[step]}
            </h1>
            <p id="setup-step-help" className="mt-2 mb-8 text-sm text-gray-600">
              {step === 0
                ? "What name goes on your documents?"
                : "Optional. You can add these later."}
            </p>
            <FormProvider {...form}>
              <form
                ref={formRef}
                onSubmit={submitStep}
                noValidate
                className="flex min-w-0 flex-col gap-6"
              >
                <SetupProfileFields step={step} />
                {formError && (
                  <p role="alert" className="text-sm text-red-700">
                    {formError}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    intent="secondary"
                    disabled={isSubmitting}
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    aria-disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="aria-disabled:cursor-wait aria-disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating…" : step === 2 ? "Create my profile" : "Continue"}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </section>
        </>
      )}
    </main>
  )
}
