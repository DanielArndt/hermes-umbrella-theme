# Umbrella Theme (`umbrella-theme`)

A Hermes Desktop UI plugin that contributes the **Umbrella**, **Umbrella Dark**, and **Umbrella Light** themes, crimson monospace/code styling, disabled programming font ligatures, and a configurable centered chat backdrop watermark.

## Features

- **Umbrella Themes:** Registers `umbrella` (adaptive light/dark), `umbrella-dark`, and `umbrella-light` themes directly via `@hermes/plugin-sdk` (`THEMES_AREA`).
- **Configurable Chat Backdrop Watermark:** Renders either the vector Umbrella Corporation octagon logo or the active profile's avatar centered on the chat canvas with adjustable corner framing (`Squircle`, `Circle`, or `Square`).
- **Code Readability & Composer Polish:** Styles inline code and code cards in Umbrella crimson, disables contextual programming font ligatures (`>=`, `<=`, `!=`, `=>`), and synchronizes the rotating composer prompt hints toggle.
- **Zero-Patch Durability:** Survives upstream `hermes update` without requiring `Backdrop.tsx` or `skin.ts` source modifications.

## Installation

### Symlink (Local Development)

```bash
ln -s ~/projects/danielarndt/hermes-umbrella-theme ~/.hermes/desktop-plugins/umbrella-theme
```

### Git Install (Hermes Desktop)

In Hermes Desktop, open **Settings → Plugins → Install from Git** and provide the repository URL or `danielarndt/hermes-umbrella-theme`.

## Configuration

Configure under **Settings → Plugins → Umbrella Theme**:
- **Chat backdrop watermark:** Toggle the centered watermark on or off
- **Backdrop watermark source:** `Umbrella Logo` or `Profile Avatar`
- **Profile avatar backdrop shape:** `Squircle`, `Circle`, or `Square`
- **Composer prompt hints:** Show or hide rotating placeholder prompts in the empty chat input box
- **Active desktop theme:** One-click button to activate the adaptive `umbrella` theme
