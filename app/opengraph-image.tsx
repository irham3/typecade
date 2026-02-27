import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// Image metadata
export const alt = "Typecade | Type faster. Think clearer.";
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

// Generate Image
export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: "linear-gradient(to bottom right, #09090b, #18181b)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontFamily: "sans-serif",
                    boxShadow: "inset 0 0 100px rgba(0,0,0,0.5)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "40px",
                    }}
                >
                    {/* Logo mark - geometric T with keyboard-key feel */}
                    <div
                        style={{
                            width: "120px",
                            height: "120px",
                            backgroundColor: "#6366f1",
                            borderRadius: "30px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow:
                                "0 20px 40px rgba(99, 102, 241, 0.3), 0 0 60px rgba(99, 102, 241, 0.15)",
                            marginRight: "40px",
                            position: "relative",
                        }}
                    >
                        {/* Top bar of T */}
                        <div
                            style={{
                                width: "64px",
                                height: "14px",
                                background: "white",
                                borderRadius: "3px",
                            }}
                        />
                        {/* Vertical stroke of T */}
                        <div
                            style={{
                                width: "18px",
                                height: "48px",
                                background: "white",
                                borderRadius: "3px",
                                marginTop: "-2px",
                            }}
                        />
                        {/* Cursor accent */}
                        <div
                            style={{
                                position: "absolute",
                                right: "18px",
                                bottom: "16px",
                                width: "4px",
                                height: "24px",
                                background: "rgba(255,255,255,0.5)",
                                borderRadius: "2px",
                            }}
                        />
                    </div>

                    <h1
                        style={{
                            fontSize: "96px",
                            fontWeight: "900",
                            letterSpacing: "-2px",
                            color: "white",
                            margin: 0,
                        }}
                    >
                        Typecade
                    </h1>
                </div>

                <p
                    style={{
                        fontSize: "42px",
                        color: "#a1a1aa",
                        marginTop: 0,
                        fontWeight: "500",
                        letterSpacing: "-0.5px",
                    }}
                >
                    Type faster. Think clearer.
                </p>
            </div>
        ),
        {
            ...size,
        }
    );
}
