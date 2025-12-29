import { SignupForm } from "@/components/features/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-industrial-50 p-6">
      <div className="w-full max-w-md rounded-industrial bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-industrial-900">
            Create Account
          </h1>
          <p className="mt-2 text-industrial-600">
            Get started with FieldOps AI
          </p>
        </div>

        <SignupForm />
      </div>
    </main>
  );
}
