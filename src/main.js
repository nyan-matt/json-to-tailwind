import './style.css';
import { componentRegistry } from './components/registry.js';

// Helper: Tailwind spacing scale (multiples of 4px)
function pxToTailwind(val) {
  if (val % 4 === 0 && val / 4 <= 96) return val === 0 ? '' : val / 4;
  return `[${val}px]`;
}

// Helper: Closest Tailwind spacing
function pxToTailwindSpacing(px, spacingMap) {
  let closestKey = 0, minDiff = Infinity;
  for (const [key, value] of Object.entries(spacingMap)) {
    const diff = Math.abs(px - value);
    if (diff < minDiff) minDiff = diff, closestKey = key;
  }
  return { key: closestKey, px: spacingMap[closestKey], diff: minDiff };
}

// Helper: Convert normalized RGB to 0-255
function rgbTo255({ r, g, b }) {
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// Helper: Match Tailwind bg color
function rgbToTailwindBg(color) {
  const palette = [
    { name: 'bg-white', rgb: [255, 255, 255] },
    { name: 'bg-gray-100', rgb: [245, 245, 245] },
    { name: 'bg-gray-200', rgb: [229, 231, 235] },
    { name: 'bg-gray-300', rgb: [209, 213, 219] },
    { name: 'bg-gray-400', rgb: [156, 163, 175] },
    { name: 'bg-black', rgb: [0, 0, 0] }
  ];
  for (const c of palette) {
    if (Math.abs(color.r - c.rgb[0]) <= 2 && Math.abs(color.g - c.rgb[1]) <= 2 && Math.abs(color.b - c.rgb[2]) <= 2) {
      return { tailwind: c.name, style: null };
    }
  }
  return { tailwind: null, style: `rgb(${color.r},${color.g},${color.b})` };
}

// Helper: Clean Figma key to camelCase prop
function cleanPropName(key) {
  let base = key.split('#')[0].trim();
  return base.replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) => i === 0 ? w.toLowerCase() : w.toUpperCase()).replace(/\s+/g, '');
}

// Helper: Convert componentProperties to JSX props
function figmaPropsToJsxProps(props) {
  return Object.entries(props || {}).map(([key, val]) => {
    let name = cleanPropName(key);
    if (val.type === 'TEXT') return `${name}="${String(val.value).replace(/"/g, '\\"')}"`;
    else if (val.type === 'BOOLEAN' || val.type === 'NUMBER') return `${name}={${val.value}}`;
    else return `${name}="${val.value}"`;
  }).join(' ');
}

// Helper: Escape special HTML characters
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Main function: Map Figma node to HTML
function mapFigmaNodeToHtml(node, parent) {
  if (!node.visible) return '';

  let classes = [], styleAttr = '', childrenHtml = '';

  if (node.type === 'INSTANCE') {
    const compName = node.name.replace(/[^a-zA-Z0-9]/g, '');
    const Comp = componentRegistry[compName];
    const propsString = figmaPropsToJsxProps(node.componentProperties);
    if (Comp) {
      return `<${compName} ${propsString} />`;
    } else {
      return `<div class="component-placeholder">Unknown component: ${compName}</div>`;
    }
  }

  if (node.type === 'FRAME') {
    const tailwindSpacing = {
      0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128, 36: 144, 40: 160, 44: 176, 48: 192, 52: 208, 56: 224, 60: 240, 64: 256, 72: 288, 80: 320, 96: 384
    };

    // Flex direction
    if (node.layoutMode === 'HORIZONTAL') classes.push('flex', 'flex-row');
    else if (node.layoutMode === 'VERTICAL') classes.push('flex', 'flex-col');
    // Flex wrap
    if (node.layoutWrap === 'WRAP') classes.push('flex-wrap');
    else classes.push('flex-nowrap');
    // Gap
    if (node.itemSpacing) classes.push(`gap-${pxToTailwind(node.itemSpacing)}`);

    // Map Figma alignment properties to Tailwind (FRAME nodes only)
    const primaryAxisMap = {
      'MIN': 'justify-start',
      'CENTER': 'justify-center',
      'MAX': 'justify-end',
      'SPACE_BETWEEN': 'justify-between',
      'SPACE_AROUND': 'justify-around',
      'SPACE_EVENLY': 'justify-evenly',
    };
    const counterAxisMap = {
      'MIN': 'items-start',
      'CENTER': 'items-center',
      'MAX': 'items-end',
      'BASELINE': 'items-baseline',
      'STRETCH': 'items-stretch',
    };
    if (node.primaryAxisAlignItems && primaryAxisMap[node.primaryAxisAlignItems]) {
      classes.push(primaryAxisMap[node.primaryAxisAlignItems]);
    }
    if (node.counterAxisAlignItems && counterAxisMap[node.counterAxisAlignItems]) {
      classes.push(counterAxisMap[node.counterAxisAlignItems]);
    }

    // Padding
    if (node.paddingTop) classes.push(`pt-${pxToTailwind(node.paddingTop)}`);
    if (node.paddingBottom) classes.push(`pb-${pxToTailwind(node.paddingBottom)}`);
    if (node.paddingLeft) classes.push(`pl-${pxToTailwind(node.paddingLeft)}`);
    if (node.paddingRight) classes.push(`pr-${pxToTailwind(node.paddingRight)}`);

    // Sizing
    if (node.layoutSizingHorizontal === 'FILL') {
      if (parent && parent.type === 'FRAME' && (parent.layoutMode === 'HORIZONTAL' || parent.layoutMode === 'VERTICAL')) {
        if (parent.layoutMode === 'HORIZONTAL') {
          classes.push('flex-1');
        } else {
          classes.push('w-full');
        }
      } else {
        classes.push('w-full');
      }
    } else if (node.layoutSizingHorizontal === 'HUG') {
      classes.push('w-auto');
    } else if (node.layoutSizingHorizontal === 'FIXED' && node.width) {
      const { key, px, diff } = pxToTailwindSpacing(node.width, tailwindSpacing);
      if (diff <= 2) {
        classes.push(`w-${key}`);
      } else {
        styleAttr += `width:${node.width}px;`;
      }
    }

    if (node.layoutSizingVertical === 'FILL') {
      if (parent && parent.type === 'FRAME' && (parent.layoutMode === 'HORIZONTAL' || parent.layoutMode === 'VERTICAL')) {
        if (parent.layoutMode === 'VERTICAL') {
          classes.push('flex-1');
        } else {
          classes.push('h-full');
        }
      } else {
        classes.push('h-full');
      }
    } else if (node.layoutSizingVertical === 'HUG') {
      classes.push('h-auto');
    } else if (node.layoutSizingVertical === 'FIXED' && node.height) {
      const { key, px, diff } = pxToTailwindSpacing(node.height, tailwindSpacing);
      if (diff <= 2) {
        classes.push(`h-${key}`);
      } else {
        styleAttr += `height:${node.height}px;`;
      }
    }

    // Fill color
    if (Array.isArray(node.fills) && node.fills.length > 0) {
      const fill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false && f.color);
      if (fill) {
        const rgb = rgbTo255(fill.color);
        const bg = rgbToTailwindBg(rgb);
        if (bg.tailwind) {
          classes.push(bg.tailwind);
        } else if (bg.style) {
          styleAttr += `background-color: ${bg.style};`;
        }
      }
    }

    // Children
    if (node.children && node.children.length > 0) {
      childrenHtml = node.children.map(child => mapFigmaNodeToHtml(child, node)).join('');
    } else {
      childrenHtml = '&#8203;';
    }

    return `<div class="${classes.join(' ')}"${styleAttr ? ` style="${styleAttr}"` : ''} title="${node.name}">${childrenHtml}</div>`;
  }

  if (node.type === 'TEXT') {
    const tailwindSpacing = {
      0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128, 36: 144, 40: 160, 44: 176, 48: 192, 52: 208, 56: 224, 60: 240, 64: 256, 72: 288, 80: 320, 96: 384
    };

    let textClasses = [], textExtraStyle = '';

    if (node.fontSize) {
      const { key, px, diff } = pxToTailwindSpacing(node.fontSize, tailwindSpacing);
      if (diff <= 2) {
        textClasses.push(`text-${key}`);
      } else {
        textExtraStyle += `font-size:${node.fontSize}px;`;
      }
    }

    if (node.lineHeight && node.lineHeight.unit === 'PIXELS' && node.lineHeight.value) {
      const { key, px, diff } = pxToTailwindSpacing(node.lineHeight.value, tailwindSpacing);
      if (diff <= 2) {
        textClasses.push(`leading-${key}`);
      } else {
        textExtraStyle += `line-height:${node.lineHeight.value}px;`;
      }
    }

    return `<span class="${textClasses.join(' ')}"${textExtraStyle ? ` style="${textExtraStyle}"` : ''}>${node.characters || ''}</span>`;
  }

  if (node.type === 'INSTANCE' || node.type === 'InstanceNode') {
    let instClasses = ['bg-yellow-100', 'border', 'border-dashed', 'border-yellow-400', 'text-yellow-800', 'flex', 'items-center', 'justify-center'];
    let instExtraStyle = '';

    if (node.width) {
      const { key, px, diff } = pxToTailwindSpacing(node.width, {
        0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128, 36: 144, 40: 160, 44: 176, 48: 192, 52: 208, 56: 224, 60: 240, 64: 256, 72: 288, 80: 320, 96: 384
      });
      if (diff <= 2) {
        instClasses.push(`w-${key}`);
      } else {
        instExtraStyle += `width:${node.width}px;`;
      }
    }

    if (node.height) {
      const { key, px, diff } = pxToTailwindSpacing(node.height, {
        0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128, 36: 144, 40: 160, 44: 176, 48: 192, 52: 208, 56: 224, 60: 240, 64: 256, 72: 288, 80: 320, 96: 384
      });
      if (diff <= 2) {
        instClasses.push(`h-${key}`);
      } else {
        instExtraStyle += `height:${node.height}px;`;
      }
    }

    return `<div class="${instClasses.join(' ')}"${instExtraStyle ? ` style="${instExtraStyle}"` : ''}>${escapeHtml(node.name)}</div>`;
  }
}

export { mapFigmaNodeToHtml };