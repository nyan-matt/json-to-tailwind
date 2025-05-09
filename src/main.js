import './style.css';

const input = document.getElementById('json-input');
const generateBtn = document.getElementById('generate-btn');
const codePreview = document.getElementById('code-preview');
const htmlPreview = document.getElementById('html-preview');

function pxToTailwind(val) {
    // Tailwind's spacing scale is based on multiples of 4px
    if (val % 4 === 0 && val / 4 <= 96) {
        return val === 0 ? '' : val / 4;
    }
    return `[${val}px]`;
}

function rgbTo255({ r, g, b }) {
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function rgbToTailwindBg({ r, g, b }) {
    // Common Tailwind bg colors (add more as needed)
    const colors = [
        { name: 'bg-white', rgb: [255, 255, 255] },
        { name: 'bg-gray-100', rgb: [245, 245, 245] },
        { name: 'bg-gray-200', rgb: [229, 231, 235] },
        { name: 'bg-gray-300', rgb: [209, 213, 219] },
        { name: 'bg-gray-400', rgb: [156, 163, 175] },
        { name: 'bg-black', rgb: [0, 0, 0] }
    ];
    for (const c of colors) {
        if (Math.abs(r - c.rgb[0]) <= 2 && Math.abs(g - c.rgb[1]) <= 2 && Math.abs(b - c.rgb[2]) <= 2) {
            return { tailwind: c.name, style: null };
        }
    }
    return { tailwind: null, style: `background-color: rgb(${r},${g},${b})` };
}

function mapFigmaNodeToHtml(node, parent) {
    if (!node.visible) return '';
    const isFrame = node.type === 'FRAME';
    const isText = node.type === 'TEXT';
    let classes = [];
    let childrenHtml = '';

    if (isFrame) {
        // Flex direction
        if (node.layoutMode === 'HORIZONTAL') classes.push('flex', 'flex-row');
        else if (node.layoutMode === 'VERTICAL') classes.push('flex', 'flex-col');
        // Flex wrap
        if (node.layoutWrap === 'WRAP') classes.push('flex-wrap');
        else classes.push('flex-nowrap');
        // Gap
        if (node.itemSpacing) classes.push(`gap-${pxToTailwind(node.itemSpacing)}`);
        
        // Map Figma alignment properties to Tailwind (FRAME nodes only)
        // https://www.figma.com/plugin-docs/api/properties/nodes-primaryaxisalignitems/
        // https://www.figma.com/plugin-docs/api/properties/nodes-counteraxisalignitems/
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
        // Spacing scale from tailwind.config.js
        const tailwindSpacing = {
            0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128, 36: 144, 40: 160, 44: 176, 48: 192, 52: 208, 56: 224, 60: 240, 64: 256, 72: 288, 80: 320, 96: 384
        };
        function pxToTailwindSpacing(px) {
            let closestKey = 0;
            let minDiff = Infinity;
            for (const [key, value] of Object.entries(tailwindSpacing)) {
                const diff = Math.abs(px - value);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestKey = key;
                }
            }
            return { key: closestKey, px: tailwindSpacing[closestKey], diff: minDiff };
        }
        // Width
        // If no native Tailwind class, use inline style for PoC (TODO: optimize for build-time Tailwind utility extraction)
        let extraStyle = '';
        // Context-aware FILL sizing for horizontal direction
        // Use flex-1 if parent is flex-row, else w-full
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
            const { key, px, diff } = pxToTailwindSpacing(node.width);
            if (diff <= 2) {
                classes.push(`w-${key}`);
            } else {
                // PoC: use inline style for non-standard width
                // TODO: Write these to a file for Tailwind build-time extraction
                extraStyle += `width:${node.width}px;`;
            }
        }
        // Height
        // Context-aware FILL sizing for vertical direction
        // Use flex-1 if parent is flex-col, else h-full
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
            const { key, px, diff } = pxToTailwindSpacing(node.height);
            if (diff <= 2) {
                classes.push(`h-${key}`);
            } else {
                // PoC: use inline style for non-standard height
                // TODO: Write these to a file for Tailwind build-time extraction
                extraStyle += `height:${node.height}px;`;
            }
        }
        // Fill color
        let styleAttr = '';
        if (Array.isArray(node.fills) && node.fills.length > 0) {
            const fill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false && f.color);
            if (fill) {
                const rgb = rgbTo255(fill.color);
                const bg = rgbToTailwindBg(rgb);
                if (bg.tailwind) {
                    classes.push(bg.tailwind);
                } else if (bg.style) {
                    styleAttr = ` style=\"${bg.style}\"`;
                }
            }
        }
        // Children
        if (node.children && node.children.length > 0) {
            childrenHtml = node.children.map(child => mapFigmaNodeToHtml(child, node)).join('');
        } else {
            childrenHtml = '&#8203;'; // zero-width space to ensure div is rendered
        }
        // Merge extraStyle with styleAttr
        let combinedStyleAttr = styleAttr;
        if (extraStyle) {
            if (combinedStyleAttr) {
                combinedStyleAttr = combinedStyleAttr.replace(/style="/, `style="${extraStyle}`);
            } else {
                combinedStyleAttr = ` style="${extraStyle}"`;
            }
        }
        return `<div class="${classes.join(' ')}"${combinedStyleAttr} title="${node.name}">${childrenHtml}</div>`; // PoC: inline styles for non-Tailwind values
    } else if (isText) {
        // For text, render as span with font size and line height
        let textClasses = [];
        // Use the same spacing scale as for width/height
        const tailwindSpacing = {
            0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128, 36: 144, 40: 160, 44: 176, 48: 192, 52: 208, 56: 224, 60: 240, 64: 256, 72: 288, 80: 320, 96: 384
        };
        function pxToTailwindSpacing(px) {
            let closestKey = 0;
            let minDiff = Infinity;
            for (const [key, value] of Object.entries(tailwindSpacing)) {
                const diff = Math.abs(px - value);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestKey = key;
                }
            }
            return { key: closestKey, px: tailwindSpacing[closestKey], diff: minDiff };
        }
        // Font size
        // If no native Tailwind class, use inline style for PoC (TODO: optimize for build-time Tailwind utility extraction)
        let textExtraStyle = '';
        if (node.fontSize) {
            const { key, px, diff } = pxToTailwindSpacing(node.fontSize);
            if (diff <= 2) {
                textClasses.push(`text-${key}`);
            } else {
                // PoC: use inline style for non-standard font size
                // TODO: Write these to a file for Tailwind build-time extraction
                textExtraStyle += `font-size:${node.fontSize}px;`;
            }
        }
        // Line height
        if (node.lineHeight && node.lineHeight.unit === 'PIXELS' && node.lineHeight.value) {
            const { key, px, diff } = pxToTailwindSpacing(node.lineHeight.value);
            if (diff <= 2) {
                textClasses.push(`leading-${key}`);
            } else {
                // PoC: use inline style for non-standard line height
                // TODO: Write these to a file for Tailwind build-time extraction
                textExtraStyle += `line-height:${node.lineHeight.value}px;`;
            }
        }
        return `<span class="${textClasses.join(' ')}"${textExtraStyle ? ` style=\"${textExtraStyle}\"` : ''}>${node.characters || ''}</span>`; // PoC: inline styles for non-Tailwind values
    } else if (node.type === 'INSTANCE' || node.type === 'InstanceNode') {
        // InstanceNode: placeholder with correct footprint and tooltip
        const tailwindSpacing = {
            0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128, 36: 144, 40: 160, 44: 176, 48: 192, 52: 208, 56: 224, 60: 240, 64: 256, 72: 288, 80: 320, 96: 384
        };
        function pxToTailwindSpacing(px) {
            let closestKey = 0;
            let minDiff = Infinity;
            for (const [key, value] of Object.entries(tailwindSpacing)) {
                const diff = Math.abs(px - value);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestKey = key;
                }
            }
            return { key: closestKey, px: tailwindSpacing[closestKey], diff: minDiff };
        }
        let instClasses = ['bg-yellow-100', 'border', 'border-dashed', 'border-yellow-400', 'text-yellow-800', 'flex', 'items-center', 'justify-center'];
        // Width
        // If no native Tailwind class, use inline style for PoC (TODO: optimize for build-time Tailwind utility extraction)
        let instExtraStyle = '';
        if (node.width) {
            const { key, px, diff } = pxToTailwindSpacing(node.width);
            if (diff <= 2) {
                instClasses.push(`w-${key}`);
            } else {
                // PoC: use inline style for non-standard width
                // TODO: Write these to a file for Tailwind build-time extraction
                instExtraStyle += `width:${node.width}px;`;
            }
        }
        // Height
        if (node.height) {
            const { key, px, diff } = pxToTailwindSpacing(node.height);
            if (diff <= 2) {
                instClasses.push(`h-${key}`);
            } else {
                // PoC: use inline style for non-standard height
                // TODO: Write these to a file for Tailwind build-time extraction
                instExtraStyle += `height:${node.height}px;`;
            }
        }
        // Escape special HTML characters for safe tooltip rendering
        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        // Tooltip with name/properties (escaped)
        const tooltip = escapeHtml(`Component: ${node.name || node.type}\n${JSON.stringify(node, null, 2)}`);
        // Empty footprint (zero-width space)
        return `<div class="${instClasses.join(' ')}"${instExtraStyle ? ` style=\"${instExtraStyle}\"` : ''} title="${tooltip}">&#8203;</div>`; // PoC: inline styles for non-Tailwind values
    } else {
        // Unknown component: placeholder
        return `<div class=\"bg-gray-200 text-xs p-2 border border-dashed border-gray-400\" title=\"Component: ${node.type || 'Unknown'}\">&#8203;</div>`;
    }
}

function prettyPrintHtml(html) {
    // Basic pretty print for HTML string
    const tab = '    ';
    let result = '';
    let indent = '';
    html.replace(/></g, '>\n<').split('\n').forEach(line => {
        if (line.match(/^<\//)) indent = indent.slice(0, -tab.length);
        result += indent + line + '\n';
        if (line.match(/^<[^!][^>]*[^/]>/) && !line.includes('</')) indent += tab;
    });
    return result.trim();
}

function generateHtml() {
    let json;
    try {
        json = JSON.parse(input.value);
    } catch (e) {
        codePreview.textContent = 'Invalid JSON';
        htmlPreview.innerHTML = '';
        return;
    }
    const html = mapFigmaNodeToHtml(json);
    codePreview.textContent = prettyPrintHtml(html);
    htmlPreview.innerHTML = html;
}

generateBtn.addEventListener('click', generateHtml);
