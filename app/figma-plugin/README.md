# Pixel Background Figma Plugin

This plugin generates a vector pixel grid background similar to the dynamic HTML version, but as a static SVG for use in Figma.

## How to use

1. Open Figma Desktop App.
2. Go to **Menu** > **Plugins** > **Development** > **Import plugin from manifest...**
3. Select the `manifest.json` file in this directory (`/Users/bytedance/Documents/trae_projects/SVG/app/figma-plugin/manifest.json`).
4. Run the plugin "Pixel Background Generator".
5. Adjust the Width, Height, Size, and Gap as needed.
6. Click "Generate Background".

## Parameters

- **Width/Height**: Dimensions of the generated frame.
- **Pixel Size**: The width/height of each square pixel (default: 3px).
- **Gap**: The space between pixels (default: 5px).
- **Opacity**: Uses the same logic as the web version:
  - 70% chance to be very light (0-5% opacity).
  - 30% chance to be darker (5-20% opacity).
