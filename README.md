# Playable Ad Template

A reusable Phaser 3 template for multi-scene playable ads.  
The current scene contains a single labelled button. Clicking it ends the scene and advances the flow: either showing the **FinalWindow** (last scene) or **TransitionScene** (more scenes remain).  
Replace `src/Game.js`'s `_initScene()` with real gameplay for each new project.

---

## Project structure

```
config.js                        Build variants and asset manifest
game-settings.json               Base game settings (all scenes share these)
game-settings_scene-N.json       Per-scene overrides (merged on top at runtime)
game-timer.json                  Optional countdown-timer settings
final-window-settings.json       End-screen overlay layout
transition-screen-settings.json  Level-select screen layout
src/
  Game.js            Gameplay scene  ← add your game here
  TransitionScene.js Level-select screen between scenes
  Background.js      Responsive background (color or image)
  Button.js          Reusable animated CTA button component
  Helper.js          Animated finger-hint for player guidance
  FinalWindow.js     End-screen overlay (win image + CTA button)
  StateManager.js    Tracks scene-completion and level flow
  TimerScene.js      Persistent countdown timer scene
  Timer.js           Stopwatch visual component
assets/              Drop textures, audio, fonts, spine here
core/                Framework — do not edit
```

---

## game-settings.json

Base settings shared by all scenes. Scene-specific values are provided in `game-settings_scene-N.json` and **deep-merged** on top at runtime (`Game._deepMerge`). Arrays in the override file replace arrays wholesale; nested objects are recursively merged.

### `game`

| Key | Type | Description |
|-----|------|-------------|
| `buttonCaption` | string | Text on the gameplay button. Override per scene. |

### `background`

| Key | Type | Description |
|-----|------|-------------|
| `mode` | `"color"` \| `"image"` | `"color"` fills with `color`. `"image"` uses `pImage`/`lImage` textures. |
| `color` | hex string | Background fill colour when `mode` is `"color"`. |
| `pImage` / `lImage` | texture key | Portrait / landscape background texture keys (used when `mode` is `"image"`). |
| `pScaleX/Y` / `lScaleX/Y` | number | Scale multipliers for the background image. |

### `layout.ctaButton`

Position of the gameplay button in container-local space.

| Key | Description |
|-----|-------------|
| `portraitX` / `portraitY` | Button centre offset when in portrait orientation. |
| `landscapeX` / `landscapeY` | Button centre offset when in landscape orientation. |

### Adding game-specific settings

Add any custom keys directly to `game-settings.json` (or to a scene override file).  
Read them in `Game._initScene()` via `this.SETTINGS.yourKey`.

---

## Per-scene overrides — game-settings_scene-N.json

Each `game-settings_scene-N.json` overrides only the keys it declares; all other values fall back to `game-settings.json`.

**Example — scene-1 with a red background and custom caption:**
```json
{
  "game": { "buttonCaption": "Sort Cold & Hot" },
  "background": { "mode": "color", "color": "#cc4433" }
}
```

The builder injects all scene files into `window.App.scenesData` at build time.  
`Game.init()` picks the right one by matching `this._sceneId`.

---

## game-timer.json

Controls the optional countdown stopwatch. Set `gameFinalTime` to `0` to disable the timer entirely.

| Key | Type | Description |
|-----|------|-------------|
| `gameFinalTime` | number (centiseconds) | `0` = disabled. `3000` = 30 seconds. |
| `container.portraitX/Y` | number | Timer container position — portrait. |
| `container.landscapeX/Y` | number | Timer container position — landscape. |
| `container.pAlign` / `lAlign` | string | Alignment anchor, e.g. `"Top Right"`. |
| `timerScale.portrait` / `landscape` | number | Extra scale multiplier per orientation. |
| `text.*` | object | Font, colour, and size of the countdown text. |
| `appearance.*` | object | Intro/bounce animation timing. |

When `gameFinalTime > 0` the timer scene is launched automatically. On timeout `FinalWindow.show()` is called regardless of game state.

---

## final-window-settings.json

Layout of the end-screen overlay shown after the last scene completes (or on timer timeout).

### `autoShowOnLaunchMs`
If `> 0`, the FinalWindow opens automatically after this many milliseconds—useful for testing.

### `overlay`
Full-screen semi-transparent backdrop behind the win image and CTA button.

| Key | Description |
|-----|-------------|
| `fillAlpha` | Opacity of the dark overlay (`0`–`1`). |
| `blurRadius` | CSS blur radius applied to the captured background snapshot. |

### `imgFin` — win image
Aligned to the **Top** edge. `portraitY` / `landscapeY` are offsets downward from the top.

| Key | Description |
|-----|-------------|
| `portraitX/Y` / `landscapeX/Y` | Centre position. |
| `pScale` / `lScale` | Scale per orientation. |
| `intro.delayMs` / `durationMs` / `ease` | Bounce-in animation. |
| `pulse.*` | Continuous scale-pulse loop after the intro. |

Add a texture keyed `imgFin` to the asset manifest to display it.

### `btnFin` — CTA button
Aligned to the **Bottom** edge. `portraitY` / `landscapeY` are negative (upward offset from bottom).

| Key | Description |
|-----|-------------|
| `portraitX/Y` / `landscapeX/Y` | Centre position. |
| `pScale` / `lScale` | Scale per orientation. |
| `intro.*` | Zoom-in animation. |
| `twitch.*` | Periodic grow-shrink loop that attracts taps. |

Add a texture keyed `btnFin` to the asset manifest. The button calls `window.App.network.ctaClick()` on tap.

---

## transition-screen-settings.json

Layout of the level-select screen (`TransitionScene`) shown between scenes.

### `sceneButtonLabels`
Maps each scene id to the text displayed on its button.
```json
"sceneButtonLabels": {
  "scene-1": "Scene 1",
  "scene-2": "Scene 2",
  "scene-3": "Scene 3"
}
```

### `title`
Text, font, colour, and vertical position (`y`) of the "Choose your next level" header.

### `buttons`
| Key | Description |
|-----|-------------|
| `y` | Vertical centre of the button row. |
| `spacing` | Horizontal gap between buttons. |
| `scale` | Final resting scale of each button. |
| `hoverScale` | Scale multiplier on pointer-over. |
| `introDurationMs` / `introStaggerMs` | Bounce-in timing and per-button stagger. |
| `clickScaleDown` / `clickScaleDurationMs` | Click-press animation. |
| `fadeOutDurationMs` | Fade before starting the selected game scene. |
| `labelFontFamily` / `labelFontSize` / `labelColor` | Button text style. |

### `devLevelButtons`
Boolean map of scene ids visible during local dev preview.

---

## Helper.js

Animated finger hint that guides the player. Three independent modes:

### `startGameplay(getActiveCards, dropZones, [holdCells])`
Shows a drag animation from an active card to its matching drop zone.  
- `getActiveCards` — callback returning the currently active cards.  
- `dropZones` — array of DropZone instances (or any object with `.type`, `.x`, `.y`).  
- Call `helper.notifyDragStart()` when the player begins dragging to pause the hint.  
- Call `helper.notifyCorrectMove()` after a correct drop to reset the AFK countdown.

### `startLevelSelect(buttons)`
Taps each button in sequence, looping endlessly. Pass the array of button objects.

### `startFinalScreen(btnFin)`
Taps the CTA button, hides, and repeats every few seconds.

### `kill()`
Destroys all timers, tweens, and the finger sprite. Call on scene shutdown.

**Texture key:** The finger sprite uses the key `'finger'`. Add a texture with this key to the asset manifest to display it.

---

## Customisation guide

### 1 — Add a new game object to a scene

Open `src/Game.js` → `_initScene()` and construct your object there.  
Use `this.mainContainer` as the parent so it scales with the viewport.

```js
// Example: add an image centred on screen
const myImg = this.add.image(0, 0, 'myTexture');
myImg.addProperties(['pos', 'scale']);
myImg.px = 0; myImg.py = -100;   // portrait position
myImg.lx = 0; myImg.ly = -80;    // landscape position
myImg.pScaleX = 0.8; myImg.pScaleY = 0.8;
myImg.lScaleX = 1.0; myImg.lScaleY = 1.0;
this.mainContainer.add(myImg);
```

See `skills/new-game-object.skill.md` for the full pattern including alignment anchors.

### 2 — Use the Button component

```js
import Button from "./Button";

const btn = new Button({
    scene:    this,
    texture:  'myButtonTexture',  // texture key loaded in the asset manifest
    text:     'Tap me',           // optional text overlay
    px: 0, py: 200, lx: 0, ly: 150,
    pScaleX: 0.5, pScaleY: 0.5,
    lScaleX: 0.6, lScaleY: 0.6,
    callback: () => console.log('clicked'),
    container: this.mainContainer
});
```

### 3 — End the scene programmatically

Call `this._triggerEnd()` from anywhere inside `Game.js`.  
`StateManager.markCompleted(sceneId)` is called automatically, then either the FinalWindow or TransitionScene is shown based on the remaining flow.

### 4 — Add a new scene

1. Add a new `game-settings_scene-N.json` override file.
2. Add the scene id to the `flow` arrays in `config.js`.
3. Add a label in `transition-screen-settings.json → sceneButtonLabels`.

### 5 — Add assets

Drop files into `assets/textures/`, `assets/audio/`, `assets/fonts/`, or `assets/spine/`.  
Register them in the `versions` arrays inside `config.js`:

```js
's1': {
    flow: ['scene-1'],
    audio:    ['sfx'],        // file stem under assets/audio/
    fonts:    ['LilitaOne'],  // file stem under assets/fonts/
    sheets:   ['atlas'],      // sprite-sheet stem under assets/sheets/
    textures: ['bg_p', 'bg_l', 'btnFin', 'imgFin', 'finger']
}
```

---

## Build & preview

```bash
npm install           # first time
npm run dev           # local preview — builds the version in config.js currentVersion
npm run prod          # production build — all variants × all networks
```

Preview files are written to `dist_bckp/preview/`.  
Production files are written per-network under `dist_bckp/<variant>/`.

---

## Level flow in config.js

```js
// String  → force this scene
// Array   → player chooses one of these scenes (TransitionScene shown)
// levelSelect: true → start with TransitionScene

'versions': {
    // Play scene-1, then player chooses between scene-2 and scene-3
    's1-t(s2-s3)': {
        flow: ['scene-1', ['scene-2', 'scene-3']],
        audio: [], fonts: [], sheets: [], textures: []
    }
}
```

`StateManager` tracks completed scenes. `getNextScene()` returns the next forced scene. `getAvailableScenes()` returns the available choices at a choice stage. `isFlowComplete()` returns `true` when all stages are done.
