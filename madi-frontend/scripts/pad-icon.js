const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, '../assets/icons/madi-icon.png');
const output = path.join(__dirname, '../assets/icons/madi-icon-padded.png');

const SCALE = 0.7; // 아이콘 크기 비율

async function main() {
  const { width, height } = await sharp(input).metadata();
  const size = Math.max(width, height);
  const canvas = Math.round(size / SCALE);
  const offset = Math.round((canvas - size) / 2);

  await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input, top: offset, left: offset }])
    .png()
    .toFile(output);

  console.log('완료:', output);
}

main().catch(console.error);
