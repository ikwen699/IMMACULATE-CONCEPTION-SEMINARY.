const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('sharp not found. Installing sharp...');
  console.log('Run: npm install sharp --save-dev');
  console.log('Then run this script again.');
  process.exit(1);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const sizes = [192, 512];

async function generateIcons() {
  const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE" viewBox="0 0 SIZE SIZE">
  <rect width="SIZE" height="SIZE" rx="RADIUS" fill="#1e40af"/>
  <text x="HALF" y="HALF_PLUS_10" font-family="Arial, sans-serif" font-size="FONTSIZE" font-weight="bold" fill="white" text-anchor="middle">ICS</text>
</svg>`;

  for (const size of sizes) {
    const fontSize = Math.floor(size * 0.375);
    const radius = Math.floor(size * 0.125);
    const half = Math.floor(size / 2);
    const halfPlus10 = Math.floor(size / 2 + size * 0.052);

    const svg = svgTemplate
      .replace(/SIZE/g, size)
      .replace(/RADIUS/g, radius)
      .replace(/HALF_PLUS_10/g, halfPlus10)
      .replace(/HALF/g, half)
      .replace(/FONTSIZE/g, fontSize);

    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`Generated: ${outputPath}`);
  }

  // Generate favicon.ico (16x16)
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#1e40af"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">ICS</text>
</svg>`;

  const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));

  console.log('Generated: favicon.png (use as favicon.ico)');
  console.log('\nNote: You may want to convert favicon.png to .ico format using an online converter.');
}

generateIcons().catch(console.error);