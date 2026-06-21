import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Typecade Learn — 5-module touch typing curriculum";
export const dynamic = "force-static";

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
                        "radial-gradient(circle at 30% 80%, rgba(34,197,94,0.12), transparent 50%)",
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
                            background: "linear-gradient(135deg, #22C55E, #6366F1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            fontSize: 36,
                            fontWeight: 800,
                        }}
                    >
                        L
                    </div>
                    <div style={{ display: "flex",  fontSize: 32, fontWeight: 700 }}>
                        Typecade Learn
                    </div>
                </div>

                <div
                    style={{ display: "flex", 
                        marginTop: 80,
                        fontSize: 76,
                        fontWeight: 800,
                        lineHeight: 1.05,
                        letterSpacing: "-0.03em",
                        maxWidth: 940,
                    }}
                >
                    Master the keyboard,
                    <br />
                    <span style={{ color: "#22C55E" }}>one row at a time.</span>
                </div>

                <div
                    style={{ display: "flex", 
                        marginTop: 28,
                        fontSize: 28,
                        color: "#9CA3AF",
                        maxWidth: 900,
                        lineHeight: 1.4,
                    }}
                >
                    A 5-module curriculum from home row to total fluency. Free,
                    structured, and progressive.
                </div>

                {/* Module pills */}
                <div
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 14,
                    }}
                >
                    {[
                        "1 · Home Row",
                        "2 · Top Row",
                        "3 · Bottom Row",
                        "4 · Shift Key",
                        "5 · Numbers & Mastery",
                    ].map((label) => (
                        <div
                            key={label}
                            style={{
                                padding: "10px 18px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.15)",
                                backgroundColor: "rgba(99,102,241,0.08)",
                                color: "#E5E7EB",
                                fontSize: 22,
                                fontFamily: MONO_STACK,
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        ),
        size
    );
}