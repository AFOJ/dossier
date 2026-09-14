import { Button, ButtonLink, Tooltip, type IconProps } from "@/components/ui"

type QuickActionProps = {
  label: string
  icon: IconProps["icon"]
} & (
  | { to: string; onClick?: undefined }
  | {
      to?: undefined
      onClick: (clickEvent: React.MouseEvent<HTMLButtonElement>) => void
    }
)

export function QuickAction(props: Readonly<QuickActionProps>) {
  const { label, icon, to, onClick } = props
  const className = "size-8 p-0 text-gray-500 hover:text-gray-900"

  return (
    <Tooltip content={label}>
      {to !== undefined ? (
        <ButtonLink
          aria-label={label}
          icon={icon}
          intent="secondary"
          className={className}
          to={to}
        />
      ) : (
        <Button
          aria-label={label}
          icon={icon}
          intent="secondary"
          onClick={onClick}
          className={className}
        />
      )}
    </Tooltip>
  )
}
