import type { Metadata } from "next";
import { OnboardingClient } from "./client";

export const metadata: Metadata = {
    title: "Complete Profile | Typecade",
    description: "Choose your username to start typing.",
};

export default function OnboardingPage() {
    return <OnboardingClient />;
}
