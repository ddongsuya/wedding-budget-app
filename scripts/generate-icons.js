// 플레이스홀더 아이콘 생성 스크립트
// 실제 프로덕션에서는 디자이너가 만든 아이콘을 사용하세요

const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// icons 디렉토리 생성
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('📱 PWA 아이콘 디렉토리 생성 완료!');
console.log('');
console.log('⚠️  주의: 실제 아이콘 이미지를 생성하려면:');
console.log('1. https://realfavicongenerator.net/ 방문');
console.log('2. 512x512 PNG 이미지 업로드');
console.log('3. 생성된 아이콘들을 public/icons/ 폴더에 복사');
console.log('');
console.log('필요한 아이콘 크기:');
sizes.forEach(size => {
  console.log(`  - icon-${size}x${size}.png`);
});
console.log('  - favicon-16x16.png');
console.log('  - favicon-32x32.png');
