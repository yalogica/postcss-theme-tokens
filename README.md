[![npm version](https://img.shields.io/npm/v/postcss-theme-tokens.svg)](https://www.npmjs.com/package/postcss-theme-tokens)
[![npm license](https://img.shields.io/npm/l/postcss-theme-tokens.svg)](https://www.npmjs.com/package/postcss-theme-tokens)

# postcss-theme-tokens

Generate CSS variables from theme configs with `color-scheme` support.

## Install
```bash
npm install postcss-theme-tokens --save-dev
```

## How to Use:
### 1. Add the plugin to your PostCSS config **postcss.config.js**:

```JS
export default {
   plugins: {
      'postcss-theme-tokens': { prefix: 'heroui', format: 'hsl' }
   },
};
```

#### Explanation of `prefix` and `format` options

- **`prefix: 'heroui'`**  
  Adds a custom prefix to all generated CSS variables to prevent naming conflicts in large projects or when integrating with other component libraries.  
  Example:
  ```css
  /* Without prefix */
  --primary: #0066ff;

  /* With prefix */
  --heroui-primary: #0066ff;
  ```
  ✅ Recommended when building reusable UI libraries or design systems.

- **`format: 'hex'`**  
  Defines the output format for color values. Supported formats:
  - `'hex'` — `#0066ff` (default)
  - `'hsl'` — `216 100% 50%` (ideal for dynamic color adjustments in CSS)
  - `'rgb'` — `0, 102, 255`

  > 🔥Tip: Use `format: 'hsl'` if you plan to manipulate colors with CSS functions like `hsl(var(--hue) 100% 50%)`.


### 2. Prepare you theme file (json, ts or js):

```JSON
{
  "themes": {
    "light": {
      "colorScheme": "light",
      "colors": {
        "default": {
          "50": "#fafafa",
          "100": "#f2f2f3",
          "200": "#ebebec",
          "300": "#e3e3e6",
          "foreground": "#000",
          "DEFAULT": "#d4d4d8"
        },
        "background": "#ffffff",
        "foreground": "#000000",
        "focus": "#006FEE",
        "overlay": "#000000"
      }
    },
    "dark": {
      "colorScheme": "dark",
      "colors": {
        "default": {
          "50": "#0d0d0e",
          "100": "#19191c",
          "200": "#26262a",
          "300": "#323238",
          "foreground": "#fff",
          "DEFAULT": "#3f3f46"
        },
        "background": "#000000",
        "foreground": "#ffffff",
        "focus": "#006FEE",
        "overlay": "#ffffff"
      }
    }
  }
}
```
> ✅ Tip: Use consistent naming and always include `colorScheme` for proper dark/light mode integration with the browser.

The source file can be TS too
```TS
export default {
  themes: {
    mytheme: {
      colorScheme: "light dark",
      colors: {
        background: "#ffffff",
        foreground: "#000000",
        focus: "#006FEE",
        overlay: "#000000",
        content: {
          DEFAULT: "#ffffff",
          foreground: "#000"
        },
      }
    }
  }
}
```


### 3. Add the plugin directive to your CSS file:
```CSS
@theme-tokens './src/theme.json';
```

### 4. The output CSS will look like this (depending on your config):
```CSS
.light {
  color-scheme: light;
  --heroui-default-50: 0.00 0.00% 98.04%;
  --heroui-default-100: 240.00 4.00% 95.10%;
  --heroui-default-200: 240.00 2.56% 92.35%;
  --heroui-default-300: 240.00 5.66% 89.61%;
  --heroui-default-foreground: 0.00 0.00% 0.00%;
  --heroui-default: 240.00 4.88% 83.92%;
  --heroui-background: 0.00 0.00% 100.00%;
  --heroui-foreground: 0.00 0.00% 0.00%;
  --heroui-focus: 212.02 100.00% 46.67%;
  --heroui-overlay: 0.00 0.00% 0.00%;
}
.dark {
  color-scheme: dark;
  --heroui-default-50: 240.00 3.70% 5.29%;
  --heroui-default-100: 240.00 5.66% 10.39%;
  --heroui-default-200: 240.00 5.00% 15.69%;
  --heroui-default-300: 240.00 5.66% 20.78%;
  --heroui-default-foreground: 0.00 0.00% 100.00%;
  --heroui-default: 240.00 5.26% 26.08%;
  --heroui-background: 0.00 0.00% 0.00%;
  --heroui-foreground: 0.00 0.00% 100.00%;
  --heroui-focus: 212.02 100.00% 46.67%;
  --heroui-overlay: 0.00 0.00% 100.00%;
}
```

## License

[MIT](LICENSE)