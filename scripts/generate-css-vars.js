#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const primitives = JSON.parse(fs.readFileSync(path.join(baseDir, 'src/theme/primitives/primitives.json'), 'utf8'));
const lightSemantic = JSON.parse(fs.readFileSync(path.join(baseDir, 'src/theme/semantic/light/light.json'), 'utf8'));
const darkSemantic  = JSON.parse(fs.readFileSync(path.join(baseDir, 'src/theme/semantic/dark/dark.json'), 'utf8'));

function resolveRefs(obj, root) {
  if (obj && typeof obj.value === 'string' && obj.value.startsWith('{')) {
    const refPath = obj.value.slice(1, -1).split('.');
    let curr = root;
    for (const key of refPath) curr = curr[key];
    return { ...obj, value: curr.value ?? curr };
  }
  if (Array.isArray(obj)) {
    return obj.map(item => resolveRefs(item, root));
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, resolveRefs(v, root)])
    );
  }
  return obj;
}

function extractCssVars(obj, prefix = '') {
  let vars = [];
  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val.value !== 'undefined') {
      const varName = `${prefix}${key.replace(/\s+/g, '-').toLowerCase()}`;
      let v = val.value;
      if (typeof v === 'number') v = `${v}px`;
      vars.push(`  --${varName}: ${v};`);
    } else if (typeof val === 'object') {
      vars = vars.concat(extractCssVars(val, `${prefix}${key}-`));
    }
  }
  return vars;
}

const resolvedLight = resolveRefs(lightSemantic.color, { color: primitives.color });
const resolvedDark  = resolveRefs(darkSemantic.color,  { color: primitives.color });

const lightVars = extractCssVars(resolvedLight, 'color-');
const darkVars  = extractCssVars(resolvedDark,  'color-');

const primitiveColorVars       = extractCssVars(primitives.color, 'color-');
const primitiveSpacingVars     = extractCssVars(primitives.spacing, 'spacing-');
const primitiveRadiusVars      = extractCssVars(primitives.radius, 'radius-');
const primitiveFontFamilyVars  = primitives.font && primitives.font.family ? extractCssVars(primitives.font.family, 'font-family-') : [];
const primitiveFontSizeVars    = primitives.font && primitives.font.size   ? extractCssVars(primitives.font.size, 'font-size-')   : [];

// Build CSS: root primitives then semantic themes
const lines = [];
lines.push(':root {');
lines.push(...primitiveColorVars);
lines.push(...primitiveSpacingVars);
lines.push(...primitiveRadiusVars);
lines.push(...primitiveFontFamilyVars);
lines.push(...primitiveFontSizeVars);
lines.push('}');
lines.push('');
lines.push('.theme-light {');
lines.push(...lightVars);
lines.push('}');
lines.push('');
lines.push('.theme-dark {');
lines.push(...darkVars);
lines.push('}');

fs.writeFileSync(path.join(baseDir, 'src/generated-theme.css'), lines.join('\n'), 'utf8');
console.log('Generated src/generated-theme.css');
