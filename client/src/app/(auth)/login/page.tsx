"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import { Button, ErrorBanner, FieldError, Input, Label, Spinner } from "@/components/ui";
import { authApi } from "@/features/auth/api";
import { useRedirectIfAuthed } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/store";
import { AuthCard } from "@/features/auth/components/AuthCard";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
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
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your FinanceAI Pro account."
      footer={{ text: "No account?", linkLabel: "Create one", href: "/register" }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>

        <ErrorBanner message={formError} />

        <Button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2">
          {isSubmitting && <Spinner className="h-4 w-4" />}
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
