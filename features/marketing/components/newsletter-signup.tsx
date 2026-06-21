"use client";

import { Mail, Check } from "@/components/icons";
import { useState } from "react";

/**
 * Newsletter capture — hosted-form pattern that works with `output: 'export'`.
 *
 * Why no server action: Next.js static export doesn't ship a Node runtime,
 * so server actions and /api routes are unavailable. Hosting the form
 * submission at a third-party service (Buttondown, Loops, ConvertKit,
 * Formspree) sidesteps this — the form POSTs directly to their endpoint
 * and we get progressive enhancement (works without JS).
 *
 * Setup:
 *   1. Sign up at https://buttondown.email (free 100 subscribers).
 *   2. Set NEXT_PUBLIC_NEWSLETTER_ENDPOINT in .env.local to your
 *      Buttondown form URL, e.g. https://buttondown.email/yourusername
 *      (the `<form action>` target).
 *   3. Apply supabase/migrations/0002_newsletter_signups.sql ONLY if you
 *      also want to keep a local mirror in your own DB for analytics.
 *      If you skip that, all subscriber data lives at the provider —
 *      which is the typical setup.
 */
export function NewsletterSignup({
    source = "homepage-footer",
    variant = "panel",
    endpoint,
}: {
    source?: string;
    variant?: "panel" | "inline";
    /** Override the form endpoint (defaults to env var). */
    endpoint?: string;
}) {
    const [email, setEmail] = useState("");
    const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const target =
        endpoint ??
        process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT ??
        "";

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!target) {
            setErrorMsg("Newsletter endpoint not configured.");
            setState("error");
            return;
        }
        setState("submitting");
        setErrorMsg("");
        try {
            // Buttondown's public form accepts a plain
            // application/x-www-form-urlencoded POST. We use no-cors because
            // the response redirects to a confirmation page we can't read.
            const form = new FormData();
            form.append("email", email);
            form.append("source", source);
            await fetch(target, {
                method: "POST",
                body: form,
                mode: "no-cors",
            });
            setState("success");
            setEmail("");
        } catch {
            setErrorMsg("Could not subscribe right now. Try again later.");
            setState("error");
        }
    }

    if (state === "success") {
        return (
            <div
                role="status"
                className={
                    variant === "panel"
                        ? "w-full max-w-md mx-auto p-6 rounded-2xl bg-accent/10 border border-accent/30 text-center"
                        : "flex items-center gap-2 text-sm text-accent"
                }
            >
                {variant === "panel" && (
                    <>
                        <div className="mx-auto w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                            <Check size={18} className="text-accent" />
                        </div>
                        <h3 className="font-display font-bold text-foreground mb-1">
                            Thanks — you&apos;re in!
                        </h3>
                        <p className="text-sm text-text-dim">
                            We&apos;ll only email when there&apos;s something genuinely worth saying.
                        </p>
                    </>
                )}
                {variant === "inline" && (
                    <>
                        <Check size={14} />
                        <span>Subscribed. Thanks!</span>
                    </>
                )}
            </div>
        );
    }

    if (variant === "inline") {
        return (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
                <label className="sr-only" htmlFor={`nl-email-${source}`}>Email address</label>
                <input
                    id={`nl-email-${source}`}
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    disabled={state === "submitting"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-foreground/5 border border-foreground/10 text-sm text-foreground placeholder:text-text-dim/50 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                    type="submit"
                    disabled={state === "submitting"}
                    className="px-4 py-2 rounded-lg bg-accent text-background text-sm font-bold disabled:opacity-60 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
                >
                    <Mail size={14} />
                    Subscribe
                </button>
                {state === "error" && (
                    <p role="alert" className="text-xs text-error-text w-full">{errorMsg}</p>
                )}
            </form>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-foreground/5 border border-foreground/10">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-accent/15 text-accent">
                    <Mail size={16} />
                </div>
                <h3 className="font-display font-bold text-foreground">Get the next launch update</h3>
            </div>
            <p className="text-sm text-text-dim mb-4">
                We don&apos;t email often — only when there&apos;s a feature worth announcing
                or a community milestone worth celebrating.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <label className="sr-only" htmlFor={`nl-email-${source}`}>Email address</label>
                <input
                    id={`nl-email-${source}`}
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    disabled={state === "submitting"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-foreground/10 text-sm text-foreground placeholder:text-text-dim/50 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                    type="submit"
                    disabled={state === "submitting"}
                    className="px-4 py-2 rounded-lg bg-accent text-background text-sm font-bold disabled:opacity-60 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
                >
                    <Mail size={14} />
                    Subscribe
                </button>
            </form>
            {state === "error" && (
                <p role="alert" className="text-xs text-error-text mt-2">{errorMsg}</p>
            )}
            {!target && (
                <p className="text-[10px] text-text-dim/50 mt-2">
                    Set <code>NEXT_PUBLIC_NEWSLETTER_ENDPOINT</code> in .env.local to activate.
                </p>
            )}
        </div>
    );
}