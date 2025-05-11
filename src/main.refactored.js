import './style.css';
import { componentRegistry } from './components/registry.js';

// Tailwind spacing scale map
const TAILWIND_SPACING = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36,
  10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112,
  32: 128, 36: 144, 40: 160, 44: 176, 48: 192, 52: 208, 56: 224,
  60: 240, 64: 256, 72: 288, 80: 320, 96: 384
};

function pxToTailwind(val) {
  if (val % 4 === 0 && val / 4 <= 96) return val === 0 ? '' : val / 4;
  return `[${val}px]`;
}

function pxToTailwindSpacing(px) {
  let closestKey = 0, minDiff = Infinity;
  for (const [key, value] of Object.entries(TAILWIND_SPACING)) {
    const diff = Math.abs(px - value);
    if (diff < minDiff) { minDiff = diff; closestKey = key; }
  }
  return { key: closestKey, px: TAILWIND_SPACING[closestKey], diff: minDiff };
}

function rgbTo255({ r, g, b }) {
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToTailwindBg({ r, g, b }) {
  const palette = [
    { name: 'bg-white', rgb: [255, 255, 255] },
    { name: 'bg-gray-100', rgb: [245, 245, 245] },
    { name: 'bg-gray-200', rgb: [229, 231, 235] },
    { name: 'bg-gray-300', rgb: [209, 213, 219] },
    { name: 'bg-gray-400', rgb: [156, 163, 175] },
    { name: 'bg-black', rgb: [0, 0, 0] }
  ];
  for (const c of palette) {
    if (Math.abs(r - c.rgb[0]) <= 2 && Math.abs(g - c.rgb[1]) <= 2 && Math.abs(b - c.rgb[2]) <= 2) {
      return { tailwind: c.name, style: null };
    }
  }
  return { tailwind: null, style: `background-color: rgb(${r},${g},${b})` };
}

function cleanPropName(key) {
  let base = key.split('#')[0].trim();
  return base.replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) => i === 0 ? w.toLowerCase() : w.toUpperCase()).replace(/\s+/g, '');
}

function figmaPropsToJsxProps(props) {
  return Object.entries(props || {}).map(([k, v]) => {
    let name = cleanPropName(k);
    if (v.type === 'TEXT') return `${name}="${String(v.value).replace(/"/g, '\"')}"`;
    if (v.type === 'BOOLEAN' || v.type === 'NUMBER') return `${name}={${v.value}}`;
    return `${name}="${v.value}"`;
  }).join(' ');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mapFigmaNodeToHtml(node, parent) {
  if (!node.visible) return '';

  // INSTANCE
  if (node.type === 'INSTANCE' || node.type === 'InstanceNode') {
    const compName = node.name.replace(/[^a-zA-Z0-9]/g, '');
    const Comp = componentRegistry[compName];
    const propsString = figmaPropsToJsxProps(node.componentProperties);
    return Comp
      ? `<${compName} ${propsString} />`
      : `<div class="component-placeholder">Unknown component: ${compName}</div>`;
  }

  // FRAME
  if (node.type === 'FRAME') {
    const classes = [];
    let styleStr = '';

    if (node.layoutMode === 'HORIZONTAL') classes.push('flex', 'flex-row');
    if (node.layoutMode === 'VERTICAL') classes.push('flex', 'flex-col');
    if (node.layoutWrap === 'WRAP') classes.push('flex-wrap'); else classes.push('flex-nowrap');
    if (node.itemSpacing) classes.push(`gap-${pxToTailwind(node.itemSpacing)}`);

    const pMap = { MIN: 'justify-start', CENTER: 'justify-center', MAX: 'justify-end', SPACE_BETWEEN: 'justify-between', SPACE_AROUND: 'justify-around', SPACE_EVENLY: 'justify-evenly' };
    const cMap = { MIN: 'items-start', CENTER: 'items-center', MAX: 'items-end', BASELINE: 'items-baseline', STRETCH: 'items-stretch' };
    if (node.primaryAxisAlignItems && pMap[node.primaryAxisAlignItems]) classes.push(pMap[node.primaryAxisAlignItems]);
    if (node.counterAxisAlignItems && cMap[node.counterAxisAlignItems]) classes.push(cMap[node.counterAxisAlignItems]);

    if (node.paddingTop) classes.push(`pt-${pxToTailwind(node.paddingTop)}`);
    if (node.paddingBottom) classes.push(`pb-${pxToTailwind(node.paddingBottom)}`);
    if (node.paddingLeft) classes.push(`pl-${pxToTailwind(node.paddingLeft)}`);
    if (node.paddingRight) classes.push(`pr-${pxToTailwind(node.paddingRight)}`);

    if (node.layoutSizingHorizontal === 'FILL') classes.push(parent && parent.layoutMode === 'HORIZONTAL' ? 'flex-1' : 'w-full');
    else if (node.layoutSizingHorizontal === 'HUG') classes.push('w-auto');
    else if (node.layoutSizingHorizontal === 'FIXED' && node.width) {
      const { key, diff } = pxToTailwindSpacing(node.width);
      if (diff <= 2) classes.push(`w-${key}`); else styleStr += `width:${node.width}px;`;
    }

    if (node.layoutSizingVertical === 'FILL') classes.push(parent && parent.layoutMode === 'VERTICAL' ? 'flex-1' : 'h-full');
    else if (node.layoutSizingVertical === 'HUG') classes.push('h-auto');
    else if (node.layoutSizingVertical === 'FIXED' && node.height) {
      const { key, diff } = pxToTailwindSpacing(node.height);
      if (diff <= 2) classes.push(`h-${key}`); else styleStr += `height:${node.height}px;`;
    }

    if (Array.isArray(node.fills) && node.fills.length > 0) {
      const fill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false && f.color);
      if (fill) {
        const rgb = rgbTo255(fill.color);
        const bg = rgbToTailwindBg(rgb);
        if (bg.tailwind) classes.push(bg.tailwind);
        else if (bg.style) styleStr += bg.style;
      }
    }

    const childrenHtml = (node.children || []).map(c => mapFigmaNodeToHtml(c, node)).join('') || '&#8203;';
    return `<div class="${classes.join(' ')}"${styleStr ? ` style="${styleStr}"` : ''} title="${escapeHtml(node.name)}">${childrenHtml}</div>`;
  }

  // TEXT
  if (node.type === 'TEXT') {
    const classes = [];
    let styleStr = '';
    if (node.fontSize) {
      const { key, diff } = pxToTailwindSpacing(node.fontSize);
      if (diff <= 2) classes.push(`text-${key}`); else styleStr += `font-size:${node.fontSize}px;`;
    }
    if (node.lineHeight && node.lineHeight.unit === 'PIXELS' && node.lineHeight.value) {
      const { key, diff } = pxToTailwindSpacing(node.lineHeight.value);
      if (diff <= 2) classes.push(`leading-${key}`); else styleStr += `line-height:${node.lineHeight.value}px;`;
    }
    return `<span class="${classes.join(' ')}"${styleStr ? ` style="${styleStr}"` : ''}>${escapeHtml(node.characters || '')}</span>`;
  }

  return '';
}

export { mapFigmaNodeToHtml };
