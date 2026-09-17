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
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters").max(128),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
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
      const res = await authApi.register(values.email, values.password, values.name);
      setAuth(res.access_token, res.user);
      toast.success("Account created", { description: "We added a Cash account to get you started." });
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking spending with AI categorization."
      footer={{ text: "Already have an account?", linkLabel: "Log in", href: "/login" }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" type="text" autoComplete="name" placeholder="Your name" {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 6 characters.">
          <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register("password")} />
        </Field>

        <ErrorBanner message={formError} />

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
