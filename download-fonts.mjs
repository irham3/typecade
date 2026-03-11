import fs from 'fs';
import https from 'https';
import path from 'path';

const getTTFUrl = (weight) => new Promise((resolve) => {
    https.get(`https://fonts.googleapis.com/css?family=Space+Grotesk:${weight}`, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            const match = data.match(/url\((.*?)\)/);
            if (match && match[1]) {
                resolve(match[1]);
            } else {
                resolve(null);
            }
        });
    });
});

const download = (url, dest) => new Promise((resolve, reject) => {
    https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
            return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => resolve());
    }).on('error', reject);
});

async function main() {
    if (!fs.existsSync('public/fonts')) {
        fs.mkdirSync('public/fonts', { recursive: true });
    }
    const boldUrl = await getTTFUrl(700);
    const mediumUrl = await getTTFUrl(500);

    console.log('Bold URL:', boldUrl);
    console.log('Medium URL:', mediumUrl);

    if (boldUrl) await download(boldUrl, path.join('public', 'fonts', 'SpaceGrotesk-Bold.ttf'));
    if (mediumUrl) await download(mediumUrl, path.join('public', 'fonts', 'SpaceGrotesk-Medium.ttf'));
    console.log('Done!');
}

main();
