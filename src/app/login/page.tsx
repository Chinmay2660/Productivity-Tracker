"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Shield, Sparkles, Zap } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import AppLogo from "@/components/ui/AppLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { apiPost, getErrorMessage } from "@/lib/api";
import { getCareerFlowAppUrl, googleLoginUrl } from "@/lib/apps-client";
import { useUser } from "@/components/providers/UserProvider";
import toast from "react-hot-toast";
import { getHomePath } from "@/lib/home";
import type { User } from "@/types";

type AuthTab = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AuthTabs({
  tab,
  onChange,
}: {
  tab: AuthTab;
  onChange: (tab: AuthTab) => void;
}) {
  const tabs: { id: AuthTab; label: string }[] = [
    { id: "signin", label: "Sign in" },
    { id: "signup", label: "Sign up" },
  ];

  return (
    <div className="mb-3 flex rounded-lg bg-[var(--surface-muted)] p-1">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={clsx(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            tab === item.id
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-soft"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-3">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[var(--border)]" />
      </div>
      <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
        <span className="bg-[var(--card)] px-2 text-[var(--muted)]">{label}</span>
      </div>
    </div>
  );
}

function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();
  const [tab, setTab] = useState<AuthTab>(() =>
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const authError = searchParams.get("error");

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.href = googleLoginUrl();
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const result = await apiPost<{ user: User }>("/api/auth/guest", {});
      setUser(result.user);
      toast.success("Welcome to the demo!");
      router.push(getHomePath(result.user));
    } catch (err) {
      toast.error(getErrorMessage(err, "Demo login failed"));
    } finally {
      setGuestLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiPost<{ user: User }>("/api/auth/login", {
        username,
        code,
      });
      setUser(result.user);
      toast.success(`Welcome back, ${result.user.name}!`);
      router.push(getHomePath(result.user));
    } catch (err) {
      toast.error(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      const result = await apiPost<{ user: User }>("/api/auth/register", {
        username,
        name,
        code,
      });
      setUser(result.user);
      toast.success("Account created! Save your 6-digit code.");
      router.push("/onboarding");
    } catch (err) {
      toast.error(getErrorMessage(err, "Registration failed"));
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Card padded={false} className="animate-scale-in p-4 sm:p-5">
      <div className="mb-3 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand">
          <Sparkles className="h-3 w-3" aria-hidden />
          Shared platform login
        </div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          {tab === "signin" ? "Welcome back" : "Create account"}
        </h2>
        <p className="mt-0.5 text-xs text-[var(--muted)] sm:text-sm">
          {tab === "signin"
            ? "Google or username + 6-digit code"
            : "Works in GrowthHub and CareerFlow"}
        </p>
      </div>

      <AuthTabs tab={tab} onChange={setTab} />

      {authError && tab === "signin" && (
        <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          Sign-in failed. Please try again.
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        {googleLoading ? (
          "Connecting..."
        ) : (
          <>
            <GoogleIcon />
            Continue with Google
          </>
        )}
      </Button>

      <AuthDivider label={tab === "signin" ? "or use code" : "or create with code"} />

      {tab === "signin" ? (
        <>
          <form onSubmit={handleLogin} className="space-y-3">
            <FormField label="Username">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="your_username"
                autoComplete="username"
                required
              />
            </FormField>
            <FormField label="6-digit code" hint="The code you chose at registration">
              <Input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                autoComplete="current-password"
                className="tracking-widest"
                required
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? "Signing in..." : "Sign in with code"}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={handleGuestLogin}
            disabled={guestLoading}
          >
            {guestLoading ? "Loading demo..." : "Try demo — no account needed"}
          </Button>
        </>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <FormField label="Username" hint="3-20 chars, letters, numbers, underscore">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="alex_prep"
              autoComplete="username"
              minLength={3}
              maxLength={20}
              required
            />
          </FormField>
          <FormField label="Display name">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
              autoComplete="name"
              required
            />
          </FormField>
          <FormField label="Login code" hint="6 digits — this is your password">
            <Input
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              autoComplete="new-password"
              className="tracking-widest"
              required
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={registerLoading || code.length !== 6}>
            {registerLoading ? "Creating..." : "Create account"}
          </Button>
        </form>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-2">
          <Zap className="h-3 w-3 shrink-0 text-brand" aria-hidden />
          <span className="text-[11px] font-medium text-[var(--foreground)]">One login</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-2">
          <Shield className="h-3 w-3 shrink-0 text-success" aria-hidden />
          <span className="text-[11px] font-medium text-[var(--foreground)]">Two apps</span>
        </div>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="login-shell flex flex-col">
      <header className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <AppLogo size="sm" />
          <span className="text-sm font-bold text-[var(--foreground)]">GrowthHub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={getCareerFlowAppUrl()}
            className="hidden text-xs font-medium text-[var(--muted)] hover:text-brand sm:inline"
          >
            CareerFlow
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center px-4 pb-4 sm:px-6">
        <Suspense
          fallback={
            <Card padded={false} className="p-5">
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
              </div>
            </Card>
          }
        >
          <LoginPanel />
        </Suspense>
      </main>
    </div>
  );
}
