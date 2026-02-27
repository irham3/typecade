import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-static'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
    const logoData = await readFile(join(process.cwd(), 'public', 'typecade-logo.png'))
    const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`

    return new ImageResponse(
        (
            <img
                src={logoSrc}
                width="180"
                height="180"
                style={{ width: '100%', height: '100%', borderRadius: 40 }}
            />
        ),
        { ...size }
    )
}
