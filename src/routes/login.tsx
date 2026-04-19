import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Login or Sign up | Gayatri" }] }),
  component: LoginPage,
});

const emailSchema = z.string().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "Min 6 characters").max(72);

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate({ to: (redirect as any) ?? "/dashboard" }); }, [user, navigate, redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e1 = emailSchema.safeParse(email);
    const e2 = passwordSchema.safeParse(password);
    if (!e1.success) return toast.error(e1.error.issues[0].message);
    if (!e2.success) return toast.error(e2.error.issues[0].message);
    setBusy(true);
    if (tab === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: name } },
      });
      if (error) toast.error(error.message); else toast.success("Account created!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message); else toast.success("Welcome back");
    }
    setBusy(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="p-8">
          <div className="flex justify-center mb-6"><Logo /></div>
          <Tabs value={tab} onValueChange={v=>setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <form onSubmit={submit} className="space-y-4">
              {tab === "signup" && (
                <div><Label>Full name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" maxLength={100} /></div>
              )}
              <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" /></div>
              <Button type="submit" disabled={busy} className="w-full bg-gradient-gold text-primary-foreground">{busy ? "Please wait…" : (tab === "login" ? "Login" : "Create account")}</Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-4">By continuing you agree to our Terms & Privacy Policy.</p>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
}
