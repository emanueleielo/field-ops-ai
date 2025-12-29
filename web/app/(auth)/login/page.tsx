import { LoginForm } from "@/components/features/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-industrial-50 p-6">
      <div className="w-full max-w-md rounded-industrial bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-industrial-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-industrial-600">
            Sign in to your FieldOps AI account
          </p>
        </div>

        <LoginForm
          message={params.message}
          errorMessage={params.error === "auth_failed" ? "Authentication failed. Please try again." : undefined}
        />
      </div>
    </main>
  );
}
