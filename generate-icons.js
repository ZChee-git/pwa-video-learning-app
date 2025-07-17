import sharp from 'sharp';
import fs from 'fs';

async function generateIcon(size, outputPath) {
    const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${size}" height="${size}" fill="#8b5cf6"/>
            <text x="${size/2}" y="${size/2 - 20}" text-anchor="middle" 
                  font-family="Arial, sans-serif" font-size="${size/8}" 
                  font-weight="bold" fill="white">智能</text>
            <text x="${size/2}" y="${size/2 + 20}" text-anchor="middle" 
                  font-family="Arial, sans-serif" font-size="${size/8}" 
                  font-weight="bold" fill="white">复习</text>
        </svg>
    `;
    
    await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
    
    console.log(`Generated ${outputPath}`);
}

async function main() {
    try {
        await generateIcon(192, './public/icon-192.png');
        await generateIcon(512, './public/icon-512.png');
        console.log('Icons generated successfully!');
    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

main();
