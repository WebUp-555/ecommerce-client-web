import fs from 'fs';
import path from 'path';
import url from 'url';

const root = path.resolve(process.cwd());
const imagesDir = path.join(root, 'public', 'Images');

const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete');

if (!fs.existsSync(imagesDir)) {
  console.log('No public/Images folder found. Nothing to clean.');
  process.exit(0);
}

// Collect all file names in public/Images
const allImages = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else allImages.push(full);
  }
};
walk(imagesDir);

// Scan source files for any references
const srcDirs = ['src', 'public', 'index.html'];
const sourceFiles = [];
const addIfFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile() && sourceFiles.push(p);
const walkSrc = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSrc(full);
    else if (/\.(jsx?|tsx?|css|scss|html|json|md)$/i.test(entry.name)) sourceFiles.push(full);
  }
};
srcDirs.forEach((d) => {
  const p = path.join(root, d);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) walkSrc(p);
  else addIfFile(p);
});

const refs = new Set();
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Match imports and direct paths to public/Images
  const regexes = [
    /from\s+['"](.+?\.(?:png|jpe?g|svg|webp|gif))['"]/gi,
    /src=['"](.+?\.(?:png|jpe?g|svg|webp|gif))['"]/gi,
    /url\((['"]?)(.+?\.(?:png|jpe?g|svg|webp|gif))\1\)/gi,
    /(\/Images\/[^\s'")]+)/gi,
  ];
  for (const rx of regexes) {
    let m;
    while ((m = rx.exec(content))) {
      const ref = m[2] || m[1];
      refs.add(ref);
    }
  }
}

// Normalize to file paths inside public/Images
const normalizeRef = (ref) => {
  if (!ref) return null;
  // Absolute public path e.g. /Images/foo.png
  if (ref.startsWith('/Images/')) return path.join(imagesDir, ref.replace('/Images/', ''));
  // Direct path from public/Images in code
  if (ref.includes('public/Images')) return path.join(root, ref.split('public/Images/')[0], 'public', 'Images', ref.split('public/Images/')[1]);
  // Bare file names handled by imports rarely; skip
  return null;
};

const referencedImages = new Set();
for (const r of refs) {
  const p = normalizeRef(r);
  if (p && fs.existsSync(p)) referencedImages.add(path.resolve(p));
}

const unused = allImages.filter((p) => !referencedImages.has(path.resolve(p)));

console.log(`Found ${allImages.length} images in public/Images`);
console.log(`Referenced: ${referencedImages.size}`);
console.log(`Unused: ${unused.length}`);
unused.forEach((p) => console.log('UNUSED:', path.relative(root, p)));

if (shouldDelete && unused.length) {
  for (const p of unused) fs.rmSync(p);
  console.log(`Deleted ${unused.length} files.`);
} else if (!unused.length) {
  console.log('No unused images found.');
} else {
  console.log('Run with --delete to remove them:');
  console.log('  node scripts/cleanup-images.mjs --delete');
}