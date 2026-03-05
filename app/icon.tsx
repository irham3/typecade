import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-static'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
    const logoData = await readFile(join(process.cwd(), 'public', 'typecade-logo.png'))
    const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`

    return new ImageResponse(
        (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={logoSrc}
                alt="Typecade Logo"
                width="32"
                height="32"
                style={{ width: '100%', height: '100%', borderRadius: 8 }}
            />
        ),
        { ...size }
    )
}
