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
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
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
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start tracking spending with AI categorization."
      footer={{ text: "Already have an account?", linkLabel: "Log in", href: "/login" }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" autoComplete="name" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>

        <ErrorBanner message={formError} />

        <Button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2">
          {isSubmitting && <Spinner className="h-4 w-4" />}
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
