import postcss, { PluginCreator, AtRule } from 'postcss';
import fs from 'fs';
import path from 'path';
import Color from 'color';

const VALID_COLOR_SCHEMES = ['light', 'dark'] as const;

interface ThemesConfig {
    themes: {
        [themeName: string]: {
            colorScheme?: string;
            colors: {
                [colorName: string]: string | { [key: string]: string };
            };
        };
    };
};

interface Options {
    prefix?: string;
    format?: 'hsl' | 'hex' | 'rgb';
};

const plugin: PluginCreator<Options> = (opts = {}) => {
    const prefix = opts.prefix;
    const format = opts.format || 'hex';
    const rootDir = process.cwd();

    return {
        postcssPlugin: 'postcss-theme-tokens',

        Once(root, { result }) {
            const warnings: string[] = [];

            root.walkAtRules('theme-tokens', (rule: AtRule) => {
                const themePath = rule.params.trim().replace(/['"]/g, '');

                if (!themePath) {
                    rule.warn(result, 'Missing path in @theme-tokens');
                    return;
                }

                const fullPath = path.resolve(rootDir, themePath);
                let themesData: ThemesConfig;

                result.messages.push({
                    type: 'dependency',
                    file: fullPath
                });

                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const ext = path.extname(fullPath).toLowerCase();

                    if (ext === '.json') {
                        themesData = JSON.parse(content);
                    } else {
                        delete require.cache[fullPath];
                        const mod = require(fullPath);
                        themesData = mod.default ? mod.default : mod;
                    }

                    if (!themesData || !themesData.themes) {
                        throw new Error('Invalid theme structure: expected { themes: { ... } }');
                    }

                    const cssText = Object.entries(themesData.themes)
                        .map(([themeName, themeConfig]) => {
                            const lines: string[] = [];

                            lines.push(`.${themeName} {`);

                            if (themeConfig.colorScheme && typeof themeConfig.colorScheme === 'string') {
                                const scheme = themeConfig.colorScheme.trim();

                                if (!scheme) {
                                    warnings.push(`Empty colorScheme in theme "${themeName}"`);
                                } else {
                                    const isValid = scheme
                                        .split(/\s+/)
                                        .every(part => VALID_COLOR_SCHEMES.includes(part.toLowerCase() as typeof VALID_COLOR_SCHEMES[number]))

                                    if (isValid) {
                                        const normalizedScheme = scheme
                                            .split(/\s+/)
                                            .filter((_, i, arr) => arr.indexOf(_) === i)
                                            .join(' ')
                                            .toLowerCase();

                                        lines.push(`  color-scheme: ${normalizedScheme};`);
                                    } else {
                                        warnings.push(
                                            `Invalid colorScheme "${scheme}" in theme "${themeName}". ` +
                                            `Allowed: ${VALID_COLOR_SCHEMES.join(', ')} (or combinations like "light dark")`
                                        )
                                    }
                                }
                            }

                            Object.entries(themeConfig.colors).forEach(([colorName, value]) => {
                                if (typeof value === 'string') {
                                    try {
                                        const color = Color(value);
                                        const varName = `--${prefix ? prefix + '-' : ''}${colorName}`;
                                        let varValue: string;

                                        if (format === 'hsl') {
                                            const [h, s, l] = color.hsl().array();
                                            varValue = `${h.toFixed(2)} ${s.toFixed(2)}% ${l.toFixed(2)}%`;
                                        } else if (format === 'rgb') {
                                            const [r, g, b] = color.rgb().array();
                                            varValue = `${r}, ${g}, ${b}`;
                                        } else {
                                            varValue = color.hex().toLowerCase();
                                        }

                                        lines.push(`  ${varName}: ${varValue};`);
                                    } catch (e) {
                                        warnings.push(`Invalid color: ${value} for ${themeName}.${colorName}`);
                                    }
                                } else if (typeof value === 'object' && value !== null) {
                                    Object.entries(value).forEach(([shadeKey, shadeValue]) => {
                                        if (typeof shadeValue === 'string') {
                                            try {
                                                const color = Color(shadeValue);
                                                const varName = `--${prefix ? prefix + '-' : ''}${colorName}${shadeKey === 'DEFAULT' ? '' : '-' + shadeKey}`;
                                                let varValue: string;

                                                if (format === 'hsl') {
                                                    const [h, s, l] = color.hsl().array();
                                                    varValue = `${h.toFixed(2)} ${s.toFixed(2)}% ${l.toFixed(2)}%`;
                                                } else if (format === 'rgb') {
                                                    const [r, g, b] = color.rgb().array();
                                                    varValue = `${r}, ${g}, ${b}`;
                                                } else {
                                                    varValue = color.hex().toLowerCase();
                                                }

                                                lines.push(`  ${varName}: ${varValue};`);
                                            } catch (e) {
                                                warnings.push(`Invalid color: ${shadeValue} for ${themeName}.${colorName}.${shadeKey}`);
                                            }
                                        }
                                    });
                                }
                            });
                            lines.push(`}`);
                            return lines.join('\n');
                        })
                        .join('\n\n');

                    const parsed = postcss.parse(
                        cssText, 
                        {
                            from: result.opts.from || rule.source?.input?.file || 'virtual.css'
                        }
                    );
                    
                    rule.replaceWith(...parsed.nodes);
                } catch (err: any) {
                    rule.error(`Failed to load or parse theme file: ${fullPath}\n${err.message}`);
                }
            });

            warnings.forEach((warn) => result.warn(warn));
        }
    };
};

plugin.postcss = true;

export default plugin;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = plugin;
    module.exports.postcss = true;
};