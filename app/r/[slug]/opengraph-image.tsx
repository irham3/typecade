import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Can you beat this typing score on Typecade?";
// One generic OG image covers every /r/[slug] page (output: 'export' can't
// pre-render opengraph-image for an unbounded slug set). The page <title>
// already contains the specific WPM/accuracy, which is what Twitter/LinkedIn
// show in the card body anyway — the image just needs to look inviting.
export const dynamic = "force-static";

// Static export requires generateStaticParams on dynamic routes. We
// generate the image for a handful of popular results so that the social
// preview is at least available, but the page itself falls back to the
// generic image for any slug not in this list (Next.js will serve the
// closest match, or 404 the asset if none exists).
export function generateStaticParams() {
    return [
        { slug: "w60a95m2" },
        { slug: "w80a97m2" },
        { slug: "w100a98m2" },
        { slug: "w120a99m2" },
    ];
}

const FONT_STACK =
    '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const MONO_STACK =
    '"JetBrains Mono", "SF Mono", "Cascadia Code", Consolas, monospace';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#0A0A0A",
                    backgroundImage:
                        "radial-gradient(circle at 30% 40%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(circle at 70% 70%, rgba(244,63,94,0.15), transparent 55%)",
                    padding: 72,
                    color: "#FFFFFF",
                    fontFamily: FONT_STACK,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                    }}
                >
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 14,
                            background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            fontSize: 36,
                            fontWeight: 800,
                        }}
                    >
                        T
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 700 }}>Typecade</div>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginTop: 96,
                        maxWidth: 1000,
                    }}
                >
                    <div
                        style={{
                            fontSize: 88,
                            fontWeight: 800,
                            lineHeight: 1.05,
                            letterSpacing: "-0.04em",
                        }}
                    >
                        Someone just hit a
                    </div>
                    <div
                        style={{
                            fontSize: 88,
                            fontWeight: 800,
                            lineHeight: 1.05,
                            letterSpacing: "-0.04em",
                            color: "#818CF8",
                        }}
                    >
                        new typing record.
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 32,
                        fontSize: 30,
                        color: "#9CA3AF",
                        maxWidth: 940,
                        lineHeight: 1.4,
                    }}
                >
                    Think you can beat their score? Take the free typing test and find
                    out — no signup required.
                </div>

                <div
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 24,
                        fontFamily: MONO_STACK,
                        fontSize: 28,
                    }}
                >
                    <span style={{ color: "#6366F1" }}>typecade.com</span>
                    <span style={{ color: "#4B5563" }}>·</span>
                    <span style={{ color: "#9CA3AF" }}>Free forever</span>
                </div>
            </div>
        ),
        size
    );
}