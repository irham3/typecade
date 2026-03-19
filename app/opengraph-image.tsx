import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-static";

// Image metadata
export const alt = "Typecade | Type faster. Think clearer.";
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

// Generate Image
export default async function Image() {
    const logoData = await readFile(join(process.cwd(), "public", "typecade-logo.png"));
    const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

    // Load custom fonts
    const fontBold = await readFile(join(process.cwd(), "public", "fonts", "SpaceGrotesk-Bold.ttf"));
    const fontMedium = await readFile(join(process.cwd(), "public", "fonts", "SpaceGrotesk-Medium.ttf"));

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
                    fontFamily: '"Space Grotesk"',
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
                    {/* Actual Typecade Logo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={logoSrc}
                        alt="Typecade Logo"
                        width="120"
                        height="120"
                        style={{
                            marginRight: "40px",
                            borderRadius: "30px",
                            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(99, 102, 241, 0.15)",
                        }}
                    />

                    <h1
                        style={{
                            fontSize: "96px",
                            fontWeight: 700,
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
                        fontWeight: 500,
                        letterSpacing: "-0.5px",
                    }}
                >
                    Type faster. Think clearer.
                </p>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: "Space Grotesk",
                    data: fontBold,
                    weight: 700,
                    style: "normal",
                },
                {
                    name: "Space Grotesk",
                    data: fontMedium,
                    weight: 500,
                    style: "normal",
                },
            ],
        }
    );
}
