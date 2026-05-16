import { SignInForm } from "@/components/sign-in-form"

export default function SignInPage() {
  return (
    <div className="flex min-h-svh flex-col gap-6 bg-sidebar p-6 md:p-10 overflow-scroll">
      <div className="flex w-full m-auto min-w-48 max-w-sm flex-col gap-6">
        <SignInForm />
      </div>
    </div>
  )
}
