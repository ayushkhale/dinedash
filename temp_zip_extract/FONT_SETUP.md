# How to Setup and Link Custom Fonts in DineDash

This guide explains the process of adding, linking, and configuring your custom fonts in this Vite + Tailwind CSS React project.

---

## Step 1: Add the Font Files
Place your font files (e.g. `.woff`, `.woff2`, `.ttf`, or `.otf`) in the public folder or a subfolder in `src`:
* Recommended location: `c:\Compunic\dinedash\public\fonts\`

---

## Step 2: Define the Font Face in CSS
Open the global CSS file [src/index.css](file:///c:/Compunic/dinedash/src/index.css) and add the `@font-face` definitions at the very top of the file:

```css
@font-face {
  font-family: 'MyCustomFont';
  src: url('/fonts/MyCustomFont-Regular.woff2') format('woff2'),
       url('/fonts/MyCustomFont-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'MyCustomFont';
  src: url('/fonts/MyCustomFont-Bold.woff2') format('woff2'),
       url('/fonts/MyCustomFont-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

*Note: If you are linking an external web font (like Google Fonts or Adobe Fonts), you can instead add the `<link>` tags inside [index.html](file:///c:/Compunic/dinedash/index.html) head:*
```html
<link rel="stylesheet" href="https://use.typekit.net/your-kit-id.css">
```

---

## Step 3: Configure Tailwind CSS to Use Your Font
Since this project uses **Tailwind CSS v4**, configuration is handled directly in your main CSS file [src/index.css](file:///c:/Compunic/dinedash/src/index.css) using theme variables. 

Under the `@theme` directive, add your custom font definition:

```css
@import "tailwindcss";

@theme {
  --font-sans: 'MyCustomFont', sans-serif;
  --font-outfit: 'Outfit', sans-serif; /* Keep outfit if needed */
}
```

By mapping your font to `--font-sans`, it automatically becomes the default font family for all Tailwind text utilities (like `font-sans`, body text, etc.).

If you want to use it as a separate utility class (e.g. `font-custom`), map it to a custom variable name:
```css
@theme {
  --font-custom: 'MyCustomFont', sans-serif;
}
```
You can then use the `font-custom` utility class anywhere in your markup.

---

## Step 4: Verify Your Setup
Start the local server if it is not already running:
```bash
npm run dev
```
Open the page, inspect the elements in your browser's Developer Tools, and verify that the custom font is correctly loaded from the Network tab and applied to your text!
