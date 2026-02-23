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
                    background: "linear-gradient(to right, #09090b, #18181b)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
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
                    {/* Replica of the typecade-logo.svg but perfectly scaled for the banner */}
                    <div
                        style={{
                            width: "120px",
                            height: "120px",
                            backgroundColor: "#6366f1", // The exact color from your SVG
                            borderRadius: "30px", // Scaled rx=10
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)",
                            marginRight: "40px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "72px",
                                fontWeight: "bold",
                                color: "white",
                            }}
                        >
                            T
                        </span>
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
