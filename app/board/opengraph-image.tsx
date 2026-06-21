import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Typecade Board — Global typing test leaderboards";
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
                        "radial-gradient(circle at 70% 20%, rgba(251,191,36,0.18), transparent 55%)",
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
                            background: "linear-gradient(135deg, #FBBF24, #6366F1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#0A0A0A",
                            fontSize: 36,
                            fontWeight: 800,
                        }}
                    >
                        ★
                    </div>
                    <div style={{ display: "flex",  fontSize: 32, fontWeight: 700 }}>
                        Typecade Board
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
                    See where you rank.
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
                    Global leaderboards across all test modes and durations.
                    Filter by today, this week, or all-time.
                </div>

                {/* Mock leaderboard rows */}
                <div
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        fontFamily: MONO_STACK,
                    }}
                >
                    {[
                        { rank: 1, name: "thunderkey_", wpm: 184, acc: 99, medal: "🥇" },
                        { rank: 2, name: "neon_fox_92", wpm: 171, acc: 98, medal: "🥈" },
                        { rank: 3, name: "byte_rider", wpm: 168, acc: 97, medal: "🥉" },
                        { rank: 4, name: "you", wpm: 142, acc: 96, medal: "" },
                    ].map((row) => (
                        <div
                            key={row.rank}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 18,
                                padding: "10px 16px",
                                backgroundColor:
                                    row.name === "you"
                                        ? "rgba(99,102,241,0.15)"
                                        : "rgba(255,255,255,0.04)",
                                border:
                                    row.name === "you"
                                        ? "1px solid rgba(99,102,241,0.4)"
                                        : "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 12,
                            }}
                        >
                            <div
                                style={{ display: "flex", 
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: "#FBBF24",
                                    width: 90,
                                }}
                            >
                                {row.medal} #{row.rank}
                            </div>
                            <div style={{ display: "flex",  fontSize: 24, flex: 1, color: "#E5E7EB" }}>
                                {row.name}
                            </div>
                            <div style={{ display: "flex",  fontSize: 26, fontWeight: 700, color: "#6366F1", width: 100, textAlign: "right" }}>
                                {row.wpm} wpm
                            </div>
                            <div style={{ display: "flex",  fontSize: 22, color: "#9CA3AF", width: 90, textAlign: "right" }}>
                                {row.acc}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
        size
    );
}