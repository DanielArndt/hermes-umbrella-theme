/**
 * Umbrella Corporation Theme & Backdrop — contributes the Umbrella,
 * Umbrella Dark, and Umbrella Light themes (with native light/dark mode
 * pairing, crimson preformatted code styling, and a configurable centered
 * chat backdrop supporting either the Umbrella Corporation logo or the
 * active profile's avatar) directly via @hermes/plugin-sdk.
 *
 * Survives upstream `hermes update` with zero repo patches or bundle rebuilds.
 */

import {
  atom,
  blobatarSvg,
  host,
  ListRow,
  profileColor,
  requestTheme,
  SegmentedControl,
  THEMES_AREA,
  ToggleRow,
  useTheme,
  useValue
} from '@hermes/plugin-sdk'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'

const ID = 'umbrella-theme'
const STYLE_ELEMENT_ID = 'hermes-plugin-umbrella-theme-style'

const UMBRELLA_SVG_DATA_URI =
  'data:image/svg+xml;utf8,%3Csvg viewBox=%220 0 300 300%22 width=%22300px%22 height=%22300px%22 xmlns=%22http://www.w3.org/2000/svg%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 stroke-width=%222%22%3E%3CradialGradient id=%22red%22 cx=%22150%22 cy=%22150%22 r=%22150%22 gradientUnits=%22userSpaceOnUse%22%3E%3Cstop stop-color=%22%23c00%22 offset=%22.3%22/%3E%3Cstop stop-color=%22%23a11%22 offset=%22.7%22/%3E%3C/radialGradient%3E%3CradialGradient id=%22white%22 cx=%22150%22 cy=%22150%22 r=%22150%22 gradientUnits=%22userSpaceOnUse%22%3E%3Cstop stop-color=%22%23ddd%22 offset=%22.3%22/%3E%3Cstop stop-color=%22%23fff%22 offset=%22.6%22/%3E%3Cstop stop-color=%22%23ddd%22 offset=%22.9%22/%3E%3C/radialGradient%3E%3Cg id=%22a%22%3E%3Cg id=%22b%22%3E%3Cpath d=%22m206 5s-28 14-56 14-56-14-56-14l56 135z%22 fill=%22url(%23red)%22 stroke=%22%23870200%22/%3E%3Cpath d=%22m87 8s-10 30-30 50c-19 19-49 29-49 29l135 56z%22 fill=%22url(%23white)%22 stroke=%22%23bdbdbd%22/%3E%3C/g%3E%3Cuse transform=%22rotate(90,150,150)%22 xlink:href=%22%23b%22/%3E%3C/g%3E%3Cuse transform=%22rotate(180,150,150)%22 xlink:href=%22%23a%22/%3E%3C/svg%3E'

const PRIMARY_AVATAR_COLOR = '#8b5cf6'

const AVATAR_SHAPES = ['circle', 'squircle', 'pill', 'triangle', 'hexagon', 'cloud', 'drop']

const BLOB_KINDS = [
  'round',
  'organic',
  'boxy',
  'capsule',
  'nub',
  'cloud',
  'droplet',
  'hexagon',
  'sun',
  'triangle'
]

const BLOB_KIND_TRAIT = {
  round: 0.11,
  organic: 0.35,
  boxy: 0.54,
  capsule: 0.65,
  nub: 0.745,
  cloud: 0.825,
  droplet: 0.8875,
  hexagon: 0.9325,
  sun: 0.965,
  triangle: 0.99
}

const SHAPE_RADIUS_MAP = {
  rounded: '24%',
  circle: '50%',
  square: '0px'
}

const LIGHT_COLORS = {
  background: '#f8f9fa',
  foreground: '#1e232d',
  card: '#f3f4f5',
  cardForeground: '#1e232d',
  muted: '#eff0f2',
  mutedForeground: '#556070',
  popover: '#edeef0',
  popoverForeground: '#1e232d',
  primary: '#c8102e',
  primaryForeground: '#ffffff',
  secondary: '#f1d8dd',
  secondaryForeground: '#1e232d',
  accent: '#f2dde2',
  accentForeground: '#1e232d',
  border: '#d1d5db',
  input: '#e9ecef',
  ring: '#c8102e',
  midground: '#c8102e',
  midgroundForeground: '#ffffff',
  composerRing: '#c8102e',
  destructive: '#c8102e',
  destructiveForeground: '#ffffff',
  sidebarBackground: '#f5f6f8',
  sidebarBorder: '#d1d5db',
  userBubble: '#f2dde2',
  userBubbleBorder: '#d1d5db'
}

const DARK_COLORS = {
  background: '#0c0d10',
  foreground: '#f0f2f5',
  card: '#151619',
  cardForeground: '#f0f2f5',
  muted: '#1a1b1e',
  mutedForeground: '#8c96a5',
  popover: '#1e1f22',
  popoverForeground: '#f0f2f5',
  primary: '#ff2e44',
  primaryForeground: '#161616',
  secondary: '#50161f',
  secondaryForeground: '#f0f2f5',
  accent: '#381319',
  accentForeground: '#f0f2f5',
  border: '#262930',
  input: '#13151a',
  ring: '#ff2e44',
  midground: '#ff2e44',
  midgroundForeground: '#161616',
  composerRing: '#ff2e44',
  destructive: '#ff2e44',
  destructiveForeground: '#161616',
  sidebarBackground: '#111215',
  sidebarBorder: '#262930',
  userBubble: '#381319',
  userBubbleBorder: '#262930'
}

const DEFAULT_PREFS = {
  showBackdrop: true,
  backdropSource: 'umbrella', // 'umbrella' | 'avatar'
  avatarShape: 'rounded', // 'rounded' | 'circle' | 'square'
  showComposerPlaceholder: true
}

function normalizeProfile(name) {
  const val = String(name ?? '').trim()
  return val || 'default'
}

function defaultShapeFor(name) {
  let hash = 0
  const str = String(name || 'agent')
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return AVATAR_SHAPES[hash % AVATAR_SHAPES.length]
}

function isDarkColor(color) {
  if (!color || typeof color !== 'string' || !color.startsWith('#')) {
    return false
  }
  try {
    const n = parseInt(color.slice(1), 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110
  } catch {
    return false
  }
}

function isBlobShape(shape) {
  return shape === 'blobatar' || (typeof shape === 'string' && shape.startsWith('blobatar:'))
}

function parseBlobShape(shape, name) {
  const parts = typeof shape === 'string' ? shape.split(':') : []
  const seedPart = parts[1] || ''
  const kind = BLOB_KINDS.includes(parts[2]) ? parts[2] : ''
  return {
    seed: seedPart || name || 'agent',
    seedPart,
    kind
  }
}

/**
 * Bot Mode's roster backfill rasterizes vector SVG faces at 160x160 PNG.
 * Uploaded photos are 256x256 (or original dimensions) and pets are 96x104.
 * Detecting 160x160 lets us prefer the crisp infinite-resolution vector SVG
 * when a bot uses a Blobatar or geometric shape.
 */
function isBackfilledFacePng(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    return false
  }
  try {
    const bin = atob(dataUrl.slice('data:image/png;base64,'.length).slice(0, 48))
    if (bin.length < 24) return false
    const w =
      (bin.charCodeAt(16) << 24) |
      (bin.charCodeAt(17) << 16) |
      (bin.charCodeAt(18) << 8) |
      bin.charCodeAt(19)
    const h =
      (bin.charCodeAt(20) << 24) |
      (bin.charCodeAt(21) << 16) |
      (bin.charCodeAt(22) << 8) |
      bin.charCodeAt(23)
    return w === 160 && h === 160
  } catch {
    return false
  }
}

function svgToDataUri(svgMarkup) {
  if (!svgMarkup || typeof svgMarkup !== 'string') return null
  const normalized = svgMarkup.includes('xmlns=')
    ? svgMarkup
    : svgMarkup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  return `data:image/svg+xml;utf8,${encodeURIComponent(normalized)}`
}

function buildStaticMathFaceSvg(shape, color) {
  const safeColor = color || PRIMARY_AVATAR_COLOR
  const eyeFill = isDarkColor(safeColor) ? 'rgba(232,220,195,0.95)' : 'rgba(0,0,0,0.85)'
  const hlFill = isDarkColor(safeColor) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)'
  const eyeY = shape === 'cloud' ? 22 : 17.5

  let bodyMarkup = ''
  switch (shape) {
    case 'squircle':
      bodyMarkup = `<rect x="3" y="3" width="34" height="34" rx="11" fill="${safeColor}"/>`
      break
    case 'pill':
      bodyMarkup = `<rect x="2" y="6" width="36" height="28" rx="14" fill="${safeColor}"/>`
      break
    case 'triangle':
    case 'tetrahedron':
      bodyMarkup = `<path d="M20 5.5 L36 33.5 L4 33.5 Z" fill="${safeColor}" stroke="${safeColor}" stroke-linejoin="round" stroke-width="5"/>`
      break
    case 'hexagon':
    case 'icosahedron':
    case 'dodecahedron':
      bodyMarkup = `<path d="M20 3.5 L34.5 11.75 L34.5 28.25 L20 36.5 L5.5 28.25 L5.5 11.75 Z" fill="${safeColor}" stroke="${safeColor}" stroke-linejoin="round" stroke-width="4"/>`
      break
    case 'cloud':
      bodyMarkup = `<path d="M11 32 a7.5 7.5 0 0 1 -1 -14.9 A9.5 9.5 0 0 1 29 12.5 A7 7 0 0 1 30 32 Z" fill="${safeColor}"/>`
      break
    case 'drop':
      bodyMarkup = `<path d="M20 3 C20 3 6 20 6 27 a14 13.5 0 0 0 28 0 C34 20 20 3 20 3 Z" fill="${safeColor}"/>`
      break
    default:
      bodyMarkup = `<circle cx="20" cy="20" r="17.5" fill="${safeColor}"/>`
      break
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="380" height="380">${bodyMarkup}<g><ellipse cx="15.2" cy="${eyeY}" rx="2.3" ry="2.5" fill="${eyeFill}"/><ellipse cx="24.8" cy="${eyeY}" rx="2.3" ry="2.5" fill="${eyeFill}"/><circle cx="14.5" cy="${eyeY - 0.7}" r="0.7" fill="${hlFill}"/><circle cx="24.1" cy="${eyeY - 0.7}" r="0.7" fill="${hlFill}"/></g></svg>`
}

function resolveProfileAvatarDataUri(profileName, profileRow, assetUrl) {
  const key = normalizeProfile(profileName)
  const meta = profileRow?.ui_meta?.['hermes-bots'] || {}
  const isPrimary = key.toLowerCase() === 'default'
  const userCustomized = Boolean(meta?.custom)
  const shape = isPrimary && !userCustomized ? 'squircle' : meta.shape || defaultShapeFor(key)
  const color =
    isPrimary && !userCustomized
      ? PRIMARY_AVATAR_COLOR
      : meta.color || profileColor(key) || PRIMARY_AVATAR_COLOR

  // Prefer real uploaded/custom profile images directly.
  if (assetUrl && !isBackfilledFacePng(assetUrl)) {
    return assetUrl
  }

  // If the profile uses a Blobatar vector face, generate crisp SVG markup.
  if (isBlobShape(shape) && typeof blobatarSvg === 'function') {
    const { seed, kind } = parseBlobShape(shape, key)
    const traits =
      kind && BLOB_KIND_TRAIT[kind] !== undefined ? { shape: BLOB_KIND_TRAIT[kind] } : undefined
    try {
      const svgMarkup = blobatarSvg(seed, { size: 380, ...(traits ? { traits } : {}) })
      const uri = svgToDataUri(svgMarkup)
      if (uri) return uri
    } catch {
      // Fall through
    }
  }

  // If a backfilled raster exists, use it; otherwise synthesize the vector shape face.
  if (assetUrl) {
    return assetUrl
  }

  if (shape) {
    const uri = svgToDataUri(buildStaticMathFaceSvg(shape, color))
    if (uri) return uri
  }

  return UMBRELLA_SVG_DATA_URI
}

function cssUrlValue(dataUri) {
  const safe = String(dataUri || UMBRELLA_SVG_DATA_URI).replace(/"/g, '%22')
  return `url("${safe}")`
}

function buildUmbrellaCSS({
  showBackdrop = true,
  backdropUrl = UMBRELLA_SVG_DATA_URI,
  backdropRadius = '0px',
  tileBackdropRules = '',
  showComposerPlaceholder = true
} = {}) {
  const imageVal = cssUrlValue(backdropUrl)
  const placeholderRules = showComposerPlaceholder
    ? ''
    : `
  [data-slot='composer-rich-input']:not([aria-disabled='true']):is(:empty, [data-empty])::before {
    content: none !important;
    display: none !important;
  }
`
  const backdropRules = showBackdrop
    ? `
  /* Suppress upstream stock filler-bg0.jpg img inside Backdrop.tsx */
  [data-chat-surface] > div.pointer-events-none.mix-blend-difference > img {
    display: none !important;
  }

  /* Render centered Umbrella Corporation or profile avatar watermark */
  [data-chat-surface]::before {
    content: "" !important;
    display: block !important;
    pointer-events: none;
    position: absolute;
    inset: 0;
    margin: auto;
    width: min(38vmin, 380px);
    height: min(38vmin, 380px);
    z-index: 2;
    opacity: 0.08;
    border-radius: ${backdropRadius};
    background-image: ${imageVal} !important;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain !important;
  }
${tileBackdropRules}`
    : `
  [data-chat-surface]::before {
    content: none !important;
    display: none !important;
  }
`

  return `:root {
    --ui-inline-code-foreground: #be123c;
    --ui-inline-code-background: color-mix(in srgb, #c8102e 9%, transparent);
    --umbrella-code-foreground: #be123c;
    --umbrella-backdrop-image: ${imageVal};
    --umbrella-backdrop-radius: ${backdropRadius};
  }

  :root.dark {
    --ui-inline-code-foreground: #ff6b7d;
    --ui-inline-code-background: color-mix(in srgb, #ff2e44 14%, transparent);
    --umbrella-code-foreground: #ff6b7d;
  }

  [data-slot='aui_user-inline-code'] {
    color: var(--ui-inline-code-foreground);
    background: var(--ui-inline-code-background);
  }

  [data-slot='aui_user-fence'],
  [data-slot='aui_user-fence'] code,
  [data-slot='code-card-body'],
  [data-slot='code-card-body'] pre,
  [data-slot='code-card-body'] code,
  [data-slot='code-card-body'] pre.shiki,
  [data-slot='code-card-body'] pre.shiki span[style*='#1F2328' i],
  .aui-md pre:not(.shiki),
  .aui-prose-fence {
    color: var(--umbrella-code-foreground) !important;
  }

  pre,
  code,
  kbd,
  samp,
  .font-mono,
  .cm-editor,
  .cm-content,
  .xterm,
  [data-slot='code-card'],
  [data-slot='code-card-body'],
  [data-slot='aui_user-inline-code'],
  [data-slot='aui_user-fence'],
  [data-slot='composer-rich-input'] {
    font-variant-ligatures: none;
    font-feature-settings: 'liga' 0, 'calt' 0;
  }
${placeholderRules}${backdropRules}`
}

function buildLiveOverrideCSS({
  showBackdrop = true,
  backdropUrl = UMBRELLA_SVG_DATA_URI,
  backdropRadius = '0px',
  tileBackdropRules = '',
  showComposerPlaceholder = true
} = {}) {
  const imageVal = cssUrlValue(backdropUrl)
  const placeholderRule = showComposerPlaceholder
    ? ''
    : `
[data-slot='composer-rich-input']:not([aria-disabled='true']):is(:empty, [data-empty])::before {
  content: none !important;
  display: none !important;
}
`
  if (!showBackdrop) {
    return `${placeholderRule}
html[data-hermes-theme^="umbrella"] [data-chat-surface]::before {
  content: none !important;
  display: none !important;
}
`
  }

  return `${placeholderRule}
html[data-hermes-theme^="umbrella"] {
  --umbrella-backdrop-image: ${imageVal};
  --umbrella-backdrop-radius: ${backdropRadius};
}

html[data-hermes-theme^="umbrella"] [data-chat-surface] > div.pointer-events-none.mix-blend-difference > img {
  display: none !important;
}

html[data-hermes-theme^="umbrella"] [data-chat-surface]::before {
  content: "" !important;
  display: block !important;
  pointer-events: none;
  position: absolute;
  inset: 0;
  margin: auto;
  width: min(38vmin, 380px);
  height: min(38vmin, 380px);
  z-index: 2;
  opacity: 0.08;
  border-radius: ${backdropRadius};
  background-image: ${imageVal} !important;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain !important;
}
${tileBackdropRules}`
}

function syncLiveStyleElement(cfg) {
  if (typeof document === 'undefined') return
  let styleEl = document.getElementById(STYLE_ELEMENT_ID)
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ELEMENT_ID
    document.head.appendChild(styleEl)
  }
  const scopedCSS = buildLiveOverrideCSS(cfg)
  if (styleEl.textContent !== scopedCSS) {
    styleEl.textContent = scopedCSS
  }
}

function removeLiveStyleElement() {
  if (typeof document === 'undefined') return
  const styleEl = document.getElementById(STYLE_ELEMENT_ID)
  if (styleEl) styleEl.remove()
}

export default {
  id: ID,
  name: 'Umbrella Corporation Theme',
  description:
    'Provides the Umbrella Corporation light/dark themes, crimson code styling, and centered Umbrella or profile-avatar chat backdrop without patching app bundle files.',
  register(ctx) {
    const storedPrefs = ctx.storage.get('prefs', {})
    let initialShowPlaceholder = storedPrefs.showComposerPlaceholder ?? DEFAULT_PREFS.showComposerPlaceholder
    try {
      const lsVal = localStorage.getItem('hermes.desktop.composer-placeholder.v1')
      if (lsVal === 'true' || lsVal === 'false') {
        initialShowPlaceholder = lsVal === 'true'
      }
    } catch {
      // ignore
    }
    const prefs = atom({
      ...DEFAULT_PREFS,
      ...storedPrefs,
      showComposerPlaceholder: initialShowPlaceholder
    })
    const $profilesByName = atom({})
    const $avatarAssetMap = atom({})
    const $sessionProfileMap = atom({})
    const avatarInflight = new Set()
    const disposers = []
    const cleanupFns = []

    const resolveActiveProfileName = () => {
      const focusedStoredId = host.state.focusedStoredSessionId?.get?.()
      const focusedRuntimeId = host.state.focusedSessionId?.get?.()
      const activeRuntimeId = host.state.activeSessionId?.get?.()
      const sessionMap = $sessionProfileMap.get()
      const mapped =
        (focusedStoredId && sessionMap[focusedStoredId]) ||
        (focusedRuntimeId && sessionMap[focusedRuntimeId]) ||
        (activeRuntimeId && sessionMap[activeRuntimeId]) ||
        null

      return normalizeProfile(
        mapped || host.state.focusedSessionProfile?.get?.() || host.state.profile?.get?.()
      )
    }

    const getBackdropUrlForProfile = profileName => {
      const key = normalizeProfile(profileName)
      const profileRow = $profilesByName.get()[key] || null
      const assetUrl = $avatarAssetMap.get()[key] || null
      return resolveProfileAvatarDataUri(key, profileRow, assetUrl)
    }

    const buildTileOverridesCSS = backdropRadius => {
      const sessionMap = $sessionProfileMap.get()
      const entries = Object.entries(sessionMap)
      if (entries.length === 0) return ''

      const byProfile = new Map()
      for (const [sessionId, prof] of entries) {
        if (!sessionId || !prof) continue
        if (!byProfile.has(prof)) byProfile.set(prof, [])
        byProfile.get(prof).push(sessionId)
      }

      const rules = []
      for (const [prof, sessionIds] of byProfile.entries()) {
        const urlVal = cssUrlValue(getBackdropUrlForProfile(prof))
        // Limit selector size to avoid huge stylesheets
        const selectors = sessionIds
          .slice(0, 60)
          .map(
            id =>
              `html[data-hermes-theme^="umbrella"] [data-chat-surface][data-session-anchor="session-tile:${CSS.escape(id)}"]::before`
          )
        if (selectors.length > 0) {
          rules.push(`${selectors.join(',\n  ')} {
    background-image: ${urlVal} !important;
    border-radius: ${backdropRadius};
  }`)
        }
      }
      return rules.join('\n  ')
    }

    const computeBackdropConfig = currentPrefs => {
      const showBackdrop = Boolean(currentPrefs.showBackdrop)
      const showComposerPlaceholder = currentPrefs.showComposerPlaceholder !== false
      const useAvatar = currentPrefs.backdropSource === 'avatar'
      const activeProfile = resolveActiveProfileName()
      const backdropUrl = useAvatar ? getBackdropUrlForProfile(activeProfile) : UMBRELLA_SVG_DATA_URI
      const backdropRadius = useAvatar
        ? SHAPE_RADIUS_MAP[currentPrefs.avatarShape] || SHAPE_RADIUS_MAP.rounded
        : '0px'
      const tileBackdropRules =
        showBackdrop && useAvatar ? buildTileOverridesCSS(backdropRadius) : ''

      return {
        showBackdrop,
        backdropUrl,
        backdropRadius,
        tileBackdropRules,
        showComposerPlaceholder
      }
    }

    const registerThemes = () => {
      while (disposers.length > 0) {
        const d = disposers.pop()
        try {
          d()
        } catch {
          // ignore
        }
      }

      const cfg = computeBackdropConfig(prefs.get())
      const customCSS = buildUmbrellaCSS(cfg)
      syncLiveStyleElement(cfg)

      disposers.push(
        ctx.register({
          id: 'umbrella',
          area: THEMES_AREA,
          data: {
            name: 'umbrella',
            label: 'Umbrella',
            description: 'Umbrella Corporation — Central Hive terminal (Light & Dark adaptive)',
            colors: LIGHT_COLORS,
            darkColors: DARK_COLORS,
            customCSS
          }
        }),
        ctx.register({
          id: 'umbrella-dark',
          area: THEMES_AREA,
          data: {
            name: 'umbrella-dark',
            label: 'Umbrella Dark',
            description: 'Umbrella Corporation — Subterranean Hive bio-containment facility (Dark)',
            colors: DARK_COLORS,
            darkColors: DARK_COLORS,
            customCSS
          }
        }),
        ctx.register({
          id: 'umbrella-light',
          area: THEMES_AREA,
          data: {
            name: 'umbrella-light',
            label: 'Umbrella Light',
            description: 'Umbrella Corporation — Clinical research laboratory (Light)',
            colors: LIGHT_COLORS,
            darkColors: LIGHT_COLORS,
            customCSS
          }
        })
      )
    }

    const ensureProfileAvatarAsset = (profileName, force = false) => {
      const key = normalizeProfile(profileName)
      const current = $avatarAssetMap.get()
      if ((!force && key in current) || avatarInflight.has(key)) {
        return
      }
      if (host.state.gateway?.get?.() !== 'open') {
        return
      }

      avatarInflight.add(key)
      host
        .request('profiles.get_asset', { name: key, asset: 'avatar' })
        .then(res => {
          const url = res?.found && typeof res.data === 'string' && res.data ? res.data : null
          const prev = $avatarAssetMap.get()
          if (prev[key] !== url) {
            $avatarAssetMap.set({ ...prev, [key]: url })
            if (prefs.get().backdropSource === 'avatar') {
              registerThemes()
            }
          }
        })
        .catch(() => {
          // Do not negative-cache transient RPC errors
        })
        .finally(() => {
          avatarInflight.delete(key)
        })
    }

    const ingestSessionRows = (rows, fallbackProfile) => {
      if (!Array.isArray(rows) || rows.length === 0) return
      const prev = $sessionProfileMap.get()
      let next = prev

      const put = (id, prof, authoritative) => {
        if (!id || !prof) return
        if (!authoritative && next[id]) return
        if (next[id] !== prof) {
          if (next === prev) next = { ...prev }
          next[id] = prof
        }
      }

      for (const s of rows) {
        if (!s || typeof s !== 'object') continue
        const explicitProf = String(s.profile || s.profile_name || '').trim()
        const prof = normalizeProfile(explicitProf || fallbackProfile)
        if (!explicitProf && !fallbackProfile) continue
        const authoritative = Boolean(explicitProf)
        if (s.id) put(s.id, prof, authoritative)
        if (s.resolved_id) put(s.resolved_id, prof, authoritative)
        if (s._lineage_root_id) put(s._lineage_root_id, prof, authoritative)
        if (s.parent_session_id) put(s.parent_session_id, prof, authoritative)
        if (Array.isArray(s._lineage_ids)) {
          for (const lid of s._lineage_ids) {
            put(lid, prof, authoritative)
          }
        }
      }

      if (next !== prev) {
        $sessionProfileMap.set(next)
        if (prefs.get().backdropSource === 'avatar') {
          registerThemes()
        }
      }
    }

    const refreshProfilesAndAvatars = async (forceAssets = false) => {
      // Always ensure the currently focused/active profile's avatar asset is requested
      ensureProfileAvatarAsset(resolveActiveProfileName(), forceAssets)

      let profiles = []
      try {
        if (host.state.gateway?.get?.() === 'open') {
          const rpc = await host.request('profiles.list', { include_sessions: true })
          if (Array.isArray(rpc?.profiles) && rpc.profiles.length > 0) {
            profiles = rpc.profiles
          }
        }
      } catch {
        // Fall through to REST bridge
      }

      if (profiles.length === 0) {
        try {
          const res = await host.profiles?.list?.()
          if (Array.isArray(res?.profiles)) {
            profiles = res.profiles
          }
        } catch {
          // Ignore
        }
      }

      if (profiles.length > 0) {
        const nextMap = { ...$profilesByName.get() }
        for (const p of profiles) {
          const pName = normalizeProfile(p?.name)
          nextMap[pName] = p
          const sRows = [p?.last_session, p?.canonical_session, p?.worker_session]
            .filter(Boolean)
            .map(s => ({ ...s, profile: pName }))
          if (sRows.length > 0) {
            ingestSessionRows(sRows, pName)
          }
          if (p?.has_avatar || pName === 'default') {
            ensureProfileAvatarAsset(pName, forceAssets)
          }
        }
        $profilesByName.set(nextMap)
      }

      try {
        if (typeof host.listPersistedSessions === 'function') {
          const res = await host.listPersistedSessions(null, { profile: 'all', limit: 500 })
          if (Array.isArray(res?.sessions)) {
            ingestSessionRows(res.sessions, null)
          }
        }
      } catch {
        // Ignore
      }

      if (prefs.get().backdropSource === 'avatar') {
        registerThemes()
      }
    }

    registerThemes()
    void refreshProfilesAndAvatars()

    // Subscribe to focused profile / session / gateway transitions so the
    // avatar backdrop updates immediately when switching chats or profiles.
    const watchAtoms = [
      host.state.focusedSessionProfile,
      host.state.profile,
      host.state.focusedStoredSessionId,
      host.state.focusedSessionId,
      host.state.activeSessionId,
      host.state.gateway
    ]

    for (const st of watchAtoms) {
      if (typeof st?.listen === 'function') {
        cleanupFns.push(
          st.listen(() => {
            if (st === host.state.gateway && st.get() === 'open') {
              void refreshProfilesAndAvatars()
            } else {
              ensureProfileAvatarAsset(resolveActiveProfileName())
            }
            if (prefs.get().backdropSource === 'avatar') {
              registerThemes()
            }
          })
        )
      }
    }

    const onProfileOrSessionEvent = () => {
      void refreshProfilesAndAvatars(true)
    }

    ctx.onEvent?.('gateway.ready', onProfileOrSessionEvent)
    ctx.onEvent?.('profiles.changed', onProfileOrSessionEvent)
    ctx.onEvent?.('session.created', onProfileOrSessionEvent)
    ctx.onEvent?.('sessions.changed', onProfileOrSessionEvent)

    if (typeof window !== 'undefined') {
      const onPlaceholderEvent = ev => {
        const val = Boolean(ev?.detail)
        if (prefs.get().showComposerPlaceholder !== val) {
          const next = { ...prefs.get(), showComposerPlaceholder: val }
          prefs.set(next)
          ctx.storage.set('prefs', next)
          registerThemes()
        }
      }
      window.addEventListener('hermes:composer-placeholder-changed', onPlaceholderEvent)
      cleanupFns.push(() =>
        window.removeEventListener('hermes:composer-placeholder-changed', onPlaceholderEvent)
      )
    }

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const ch = new BroadcastChannel('hermes:sessions')
        ch.addEventListener('message', () => {
          void refreshProfilesAndAvatars()
        })
        cleanupFns.push(() => ch.close())
      } catch {
        // Ignore
      }
    }

    ctx.onDispose?.(() => {
      while (cleanupFns.length > 0) {
        const fn = cleanupFns.pop()
        try {
          fn()
        } catch {
          // ignore
        }
      }
      removeLiveStyleElement()
    })

    // Disable stock filler-bg0.jpg setting so our CSS watermark is the sole backdrop
    try {
      if (prefs.get().showBackdrop && host.settings?.get?.('backdrop.v1') === true) {
        host.settings.set('backdrop.v1', false)
      }
    } catch {
      // ignore if setting unavailable
    }

    const updatePrefs = patch => {
      const next = { ...prefs.get(), ...patch }
      prefs.set(next)
      ctx.storage.set('prefs', next)
      if (next.backdropSource === 'avatar') {
        void refreshProfilesAndAvatars()
      }
      registerThemes()
    }

    ctx.registerSettingsPage?.({
      id: 'settings',
      title: 'Umbrella Theme',
      icon: 'symbol-color',
      render: function UmbrellaSettings() {
        const currentPrefs = useValue(prefs)
        const {
          showBackdrop,
          backdropSource = 'umbrella',
          avatarShape = 'rounded',
          showComposerPlaceholder = true
        } = currentPrefs
        const { themeName, setTheme } = useTheme()

        return jsx(Fragment, {
          children: [
            jsx(ToggleRow, {
              checked: Boolean(showComposerPlaceholder),
              description:
                'Show rotating prompt hints (e.g. "What\'s on your mind?") inside the empty chat input box.',
              label: 'Composer Prompt Hints',
              onChange: val => {
                try {
                  localStorage.setItem('hermes.desktop.composer-placeholder.v1', String(Boolean(val)))
                  window.dispatchEvent(
                    new CustomEvent('hermes:composer-placeholder-changed', { detail: Boolean(val) })
                  )
                } catch {
                  // ignore
                }
                updatePrefs({ showComposerPlaceholder: val })
              }
            }),
            jsx(ToggleRow, {
              checked: Boolean(showBackdrop),
              description:
                'Render the centered watermark on the chat surface via theme CSS (no bundle rebuild required).',
              label: 'Chat backdrop watermark',
              onChange: val => updatePrefs({ showBackdrop: val })
            }),
            jsx(ListRow, {
              title: 'Backdrop watermark source',
              description:
                'Choose between the vector Umbrella Corporation octagon or the active profile’s avatar.',
              action: jsx(SegmentedControl, {
                value: backdropSource,
                onChange: val => updatePrefs({ backdropSource: val }),
                options: [
                  { id: 'umbrella', label: 'Umbrella Logo' },
                  { id: 'avatar', label: 'Profile Avatar' }
                ]
              })
            }),
            backdropSource === 'avatar' &&
              jsx(ListRow, {
                title: 'Profile avatar backdrop shape',
                description: 'Corner style applied when rendering the profile avatar on the chat backdrop.',
                action: jsx(SegmentedControl, {
                  value: avatarShape,
                  onChange: val => updatePrefs({ avatarShape: val }),
                  options: [
                    { id: 'rounded', label: 'Squircle' },
                    { id: 'circle', label: 'Circle' },
                    { id: 'square', label: 'Square' }
                  ]
                })
              }),
            jsx(ListRow, {
              title: 'Active desktop theme',
              description: `Currently using "${themeName}". Click to activate the adaptive Umbrella theme.`,
              action: jsxs('button', {
                className:
                  'rounded-md border border-(--ui-stroke-secondary) px-2.5 py-1 text-xs font-medium text-foreground hover:bg-(--chrome-action-hover)',
                onClick: () => {
                  setTheme('umbrella')
                  requestTheme('umbrella')
                },
                type: 'button',
                children: ['Activate Umbrella']
              })
            })
          ]
        })
      }
    })
  }
}
