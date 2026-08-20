import { Field, Input } from "../../../../components/ui";
import { useProfileFormContext } from "../hooks/useCreateProfileForm";

export function PersonalInfoFields() {
    const { register, formState: { errors } } = useProfileFormContext()

    return (
        <div className="grid gap-4">
            <Field label="Full name" inputId="fullName" required error={errors.fullName?.message}>
                <Input id="fullName" placeholder="John Doe" {...register("fullName", { required: "Name is required" })} />
            </Field>

            <Field label="Location" inputId="location">
                <Input id="location" placeholder="London, UK" {...register("location")} />
            </Field>

            <Field label="Phone" inputId="phone">
                <Input id="phone" placeholder="+1 (555) 000-0000" {...register("phone")} />
            </Field>

            <Field label="Email" inputId="email" error={errors.email?.message}>
                <Input
                    id="email"
                    type="email"
                    placeholder="john@doe.com"
                    {...register("email", { pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                />
            </Field>
        </div>
    )
}