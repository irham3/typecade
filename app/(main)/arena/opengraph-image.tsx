import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Typecade Arena — Real-time multiplayer typing races";
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
                        "radial-gradient(circle at 80% 30%, rgba(244,63,94,0.15), transparent 50%), radial-gradient(circle at 20% 80%, rgba(99,102,241,0.15), transparent 50%)",
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
                            background: "linear-gradient(135deg, #F43F5E, #6366F1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            fontSize: 36,
                            fontWeight: 800,
                        }}
                    >
                        ⚡
                    </div>
                    <div style={{ display: "flex",  fontSize: 32, fontWeight: 700 }}>
                        Typecade Arena
                    </div>
                </div>

                <div
                    style={{ display: "flex", 
                        marginTop: 96,
                        fontSize: 76,
                        fontWeight: 800,
                        lineHeight: 1.05,
                        letterSpacing: "-0.03em",
                        maxWidth: 980,
                    }}
                >
                    Race typists in real time.
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
                    Host a room or join one. Live WPM bars, no lag, no signup.
                </div>

                {/* Race visualization */}
                <div
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        fontFamily: MONO_STACK,
                    }}
                >
                    {[
                        { name: "neon_fox_92", wpm: 112, pct: 78, color: "#F43F5E" },
                        { name: "you", wpm: 92, pct: 64, color: "#6366F1" },
                        { name: "byte_rider", wpm: 87, pct: 60, color: "#9CA3AF" },
                    ].map((row) => (
                        <div
                            key={row.name}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 20,
                            }}
                        >
                            <div style={{ display: "flex",  fontSize: 24, width: 200, color: "#E5E7EB" }}>
                                {row.name}
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    height: 28,
                                    backgroundColor: "#1F2937",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                    display: "flex",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${row.pct}%`,
                                        height: "100%",
                                        backgroundColor: row.color,
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex",  fontSize: 28, fontWeight: 700, color: row.color, width: 90, textAlign: "right" }}>
                                {row.wpm}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
        size
    );
}