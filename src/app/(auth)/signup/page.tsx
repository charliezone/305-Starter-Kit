import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata = {
  title: "Sign Up — 305 Starter Kit",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gradient-miami">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started with the 305 Starter Kit
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
