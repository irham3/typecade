import { ImageResponse } from "next/og";

// Next.js will call this at build time. The returned Response is cached
// and served from /opengraph-image (any size variant Next adds will be
// derived from this).
//
// We export `size` and `contentType` so Next.js picks up the dimensions
// for the <meta property="og:image"> tag automatically.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Typecade — Free Typing Speed Test, WPM Tracker & Multiplayer Races";
// Static export needs explicit opt-in for OG images.
export const dynamic = "force-static";

// System font stack — works without fetching any external font and avoids
// CORS/redirect issues at build time.
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
                        "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.1), transparent 50%)",
                    padding: "72px",
                    color: "#FFFFFF",
                    fontFamily: FONT_STACK,
                }}
            >
                {/* Brand mark */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
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
                    <div
                        style={{ display: "flex", 
                            fontSize: 32,
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Typecade
                    </div>
                </div>

                {/* Hero text */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginTop: 96,
                        maxWidth: 920,
                    }}
                >
                    <div
                        style={{ display: "flex", 
                            fontSize: 84,
                            fontWeight: 800,
                            lineHeight: 1.05,
                            letterSpacing: "-0.04em",
                        }}
                    >
                        Type faster.
                    </div>
                    <div
                        style={{ display: "flex", 
                            fontSize: 84,
                            fontWeight: 800,
                            lineHeight: 1.05,
                            letterSpacing: "-0.04em",
                            color: "#818CF8",
                        }}
                    >
                        Think clearer.
                    </div>
                </div>

                <div
                    style={{ display: "flex", 
                        marginTop: 32,
                        fontSize: 28,
                        color: "#9CA3AF",
                        maxWidth: 880,
                        lineHeight: 1.4,
                    }}
                >
                    Free typing test with real-time multiplayer races, a 5-module
                    touch-typing curriculum, and global WPM leaderboards. No signup
                    required.
                </div>

                {/* Live typing teaser */}
                <div
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 18,
                        fontFamily: MONO_STACK,
                        fontSize: 36,
                        color: "#E5E7EB",
                    }}
                >
                    <span style={{ color: "#6366F1" }}>the</span>
                    <span style={{ color: "#FFFFFF" }}>quick</span>
                    <span style={{ color: "#6B7280" }}>brown fox</span>
                </div>
            </div>
        ),
        size
    );
}