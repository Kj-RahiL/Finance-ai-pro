"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-client";
import { Button, ErrorBanner, Field, Input } from "@/components/ui";
import { authApi } from "@/features/auth/api";
import { useRedirectIfAuthed } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/store";
import { AuthLayout } from "@/features/auth/components/AuthLayout";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  useRedirectIfAuthed();
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const res = await authApi.login(values.email, values.password);
      setAuth(res.access_token, res.user);
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}`);
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your FinanceAI Pro account."
      footer={{ text: "No account?", linkLabel: "Create one", href: "/register" }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
        </Field>

        <ErrorBanner message={formError} />

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
