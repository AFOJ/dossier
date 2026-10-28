import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom"
import { Home01Icon, Refresh04Icon } from "@hugeicons/core-free-icons"
import { IsometricFace } from "@/components/illustrations"
import { Button, Heading2, Subheading } from "@/components/ui"
import { usePageTitle } from "@/hooks/usePageTitle"

const FALLBACK_MESSAGE = "We encountered an unexpected error while rendering this page."

type HttpErrorInfo = {
  status: number
  statusText: string
  data: unknown
}

function getHttpErrorInfo(error: unknown): HttpErrorInfo | null {
  if (isRouteErrorResponse(error)) {
    return {
      status: error.status,
      statusText: error.statusText,
      data: error.data,
    }
  }
  if (error instanceof Response) {
    return { status: error.status, statusText: error.statusText, data: null }
  }
  return null
}

function getDataMessage(data: unknown): string | null {
  if (typeof data === "string" && data.trim() !== "") {
    return data
  }
  if (data instanceof Error && data.message.trim() !== "") {
    return data.message
  }
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string" &&
    data.message.trim() !== ""
  ) {
    return data.message
  }
  return null
}

function resolveHttpError(error: HttpErrorInfo) {
  return {
    title: error.statusText.trim() !== "" ? error.statusText : "Something went wrong",
    message:
      (typeof error.data === "string" && error.data.trim() !== ""
        ? error.data
        : getDataMessage(error.data)) ?? FALLBACK_MESSAGE,
  }
}

type ErrorBoundaryProps = { onRetry?: () => void; embedded?: boolean }

export function ErrorBoundary(props: Readonly<ErrorBoundaryProps>) {
  const navigate = useNavigate()
  const error = useRouteError()
  const httpInfo = getHttpErrorInfo(error)
  const resolved = httpInfo
    ? resolveHttpError(httpInfo)
    : {
        title: "Something went wrong",
        message: props.embedded
          ? FALLBACK_MESSAGE
          : error instanceof Error && error.message.trim() !== ""
            ? error.message
            : typeof error === "string" && error.trim() !== ""
              ? error
              : FALLBACK_MESSAGE,
      }

  const Container = props.embedded ? "div" : "main"

  usePageTitle(resolved.title)

  return (
    <Container className="flex w-full justify-center">
      <section className="mt-20 flex w-full max-w-md flex-col items-center gap-4 p-4 text-center">
        <IsometricFace />
        <Heading2>{resolved.title}</Heading2>
        <Subheading>{resolved.message}</Subheading>
        <div className="flex gap-3">
          <Button
            icon={Refresh04Icon}
            onClick={() => (props.onRetry ? props.onRetry() : navigate(0))}
          >
            {props.embedded ? "Refresh page" : "Try again"}
          </Button>
          <Button
            icon={Home01Icon}
            render={<a href={props.embedded ? "/resumes" : "/"} />}
            nativeButton={false}
            intent="secondary"
            onClick={(event) => {
              event.preventDefault()
              navigate(props.embedded ? "/resumes" : "/")
            }}
          >
            {props.embedded ? "Back to resumes" : "Go home"}
          </Button>
        </div>
      </section>
    </Container>
  )
}
