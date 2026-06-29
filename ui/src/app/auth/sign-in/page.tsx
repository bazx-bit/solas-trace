"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { Sparkles, Terminal, Activity, ArrowRight, Lock, Mail } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to sign in");
      } else {
        toast.success("Successfully logged in!");
        window.location.href = "/workspaces"; // Redirect to workspace listing
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background visual effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1),transparent_70%)]" />
      <div className="absolute top-10 left-10 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-rose-600 text-white font-bold">
          S
        </div>
        <span className="font-mono text-xs tracking-wider text-muted-foreground">SOLAS TRACE</span>
      </div>

      <div className="w-full max-w-md space-y-8 glass-panel border border-border rounded-2xl p-8 relative z-10 glass-card-glow">
        <div className="text-center space-y-2">
          <Activity className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <h2 className="text-xl font-bold font-mono tracking-wider uppercase text-foreground">
            Sign In to Solas
          </h2>
          <p className="text-xs text-muted-foreground">
            Monitor, inspect, and optimize your AI swarms
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Password
              </label>
              <a href="#" className="text-[9px] font-mono text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-foreground hover:bg-primary/90 text-white text-xs font-mono py-2.5 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 transition-all"
          >
            {loading ? "Authenticating..." : "CONTINUE"} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-primary font-mono hover:underline">
              Create account
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
