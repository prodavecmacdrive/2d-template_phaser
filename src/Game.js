import ParentScene   from "../core/framework/components/Scene";
import Utils         from "../core/framework/Utils";
import Background    from "./Background";
import FinalWindow   from "./FinalWindow";
import Helper        from "./Helper";
import BASE_SETTINGS from "../game-settings.json";
import TIMER_SETTINGS from "../game-timer.json";

/**
 * Game
 * ----
 * Template gameplay scene.
 *
 * Displays a coloured background and a single labelled button.
 * Clicking the button completes the current scene and either:
 *   • shows the FinalWindow  – if this was the last scene in the flow, or
 *   • starts TransitionScene – if more scenes remain.
 *
 * Per-scene customisation lives in game-settings_scene-N.json, which is
 * deep-merged on top of game-settings.json by _deepMerge() in init().
 *
 * ── Adding game objects ──────────────────────────────────────────────────────
 * Build your game inside _initScene(). Use this.mainContainer as the root
 * container for all objects so the responsive layout system can scale and
 * position them automatically.
 */
export default class Game extends ParentScene {

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    init(data) {
        this._sceneId = (data && data.sceneId)
            ? data.sceneId
            : (window.App.stateManager ? window.App.stateManager.getNextScene() : (window.App.flow && window.App.flow[0])) || 'scene-1';
        const sceneData = (window.App.scenesData && window.App.scenesData[this._sceneId]) || {};
        this.SETTINGS = Utils.deepMerge(BASE_SETTINGS, sceneData);
    }

    create() {
        this.gameOver = false;
        this._initScene();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scene initialisation
    // ─────────────────────────────────────────────────────────────────────────

    _initScene() {
        // ── Background ────────────────────────────────────────────────────────
        const bgCfg = this.SETTINGS.background;
        this.bg = new Background({
            scene:      this,
            background: bgCfg,
            pImage:     bgCfg.pImage,
            lImage:     bgCfg.lImage,
            pScaleX:    bgCfg.pScaleX ?? 1,
            pScaleY:    bgCfg.pScaleY ?? 1,
            lScaleX:    bgCfg.lScaleX ?? 1,
            lScaleY:    bgCfg.lScaleY ?? 1,
            container:  this.mainContainer
        });

        // ── Gameplay button ───────────────────────────────────────────────────
        const btnCfg  = (this.SETTINGS.layout && this.SETTINGS.layout.ctaButton) || {};
        const caption = (this.SETTINGS.game && this.SETTINGS.game.buttonCaption) || 'Play!';

        const btn = this.add.text(0, 0, caption, {
            fontFamily:      'LilitaOne-Regular, Arial',
            fontSize:        '64px',
            color:           '#ffffff',
            stroke:          '#000000',
            strokeThickness: 6,
            backgroundColor: 'rgba(0,0,0,0.35)',
            padding:         { x: 48, y: 24 }
        })
            .setOrigin(0.5, 0.5)
            .setDepth(5)
            .setInteractive({ useHandCursor: true });

        btn.addProperties(['pos', 'scale']);
        btn.px = btnCfg.portraitX  ?? 0;
        btn.py = btnCfg.portraitY  ?? 0;
        btn.lx = btnCfg.landscapeX ?? 0;
        btn.ly = btnCfg.landscapeY ?? 0;
        btn.pScaleX = btnCfg.portraitScale  ?? 1;
        btn.pScaleY = btnCfg.portraitScale  ?? 1;
        btn.lScaleX = btnCfg.landscapeScale ?? 1;
        btn.lScaleY = btnCfg.landscapeScale ?? 1;
        this.mainContainer.add(btn);

        btn.on('pointerover',  () => btn.setAlpha(0.85));
        btn.on('pointerout',   () => btn.setAlpha(1));
        btn.on('pointerdown',  () => {
            btn.disableInteractive();
            this._triggerEnd();
        });

        // ── Final window (hidden until end-state) ─────────────────────────────
        this.finalWindow = new FinalWindow({
            scene:     this,
            container: this.mainContainer,
            onCta:     () => this._onCta()
        });

        // ── Timer (optional) ──────────────────────────────────────────────────
        const useTimer = typeof TIMER_SETTINGS.gameFinalTime === 'number' && TIMER_SETTINGS.gameFinalTime > 0;
        if (useTimer && !this.scene.isActive('TimerScene')) {
            this.scene.launch('TimerScene');
        }

        // ── Resize + timer start ──────────────────────────────────────────────
        setTimeout(() => {
            if (!this.scene || !this.scene.key) return;
            this._resize();
            this.scale.on('resize', () => setTimeout(() => {
                if (this.scene && this.scene.key) this._resize();
            }, 50));

            if (!window.App.hasGameStarted) {
                window.App.hasGameStarted = true;
            }

            const timerScene = this.scene.get('TimerScene');
            const onTimeout = () => {
                if (!this.gameOver) {
                    this.gameOver = true;
                    this.helper?.kill();
                    this.helper = null;
                    this.finalWindow.show();
                }
            };
            if (useTimer && timerScene) {
                timerScene.launchTimer(onTimeout, () => {});
            }
        }, 50);

        this.events.once('shutdown', () => {
            this.helper?.kill();
            this.scale.removeAllListeners('resize');
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scene-end flow
    // ─────────────────────────────────────────────────────────────────────────

    _triggerEnd() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.helper?.kill();
        this.helper = null;

        window.App.stateManager.markCompleted(this._sceneId);

        if (window.App.stateManager.isFlowComplete()) {
            window.App.timerScene?.stopTimer();
            window.App.timerScene?.hideTimer();
            this.finalWindow.show();
            this.helper = new Helper({ scene: this, container: this.mainContainer });
            this.helper.startFinalScreen(this.finalWindow.btnFin);
        } else {
            this.scene.stop();
            this.scene.start('TransitionScene');
        }
    }

    _onCta() {
        window.App.network.ctaClick();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Resize
    // ─────────────────────────────────────────────────────────────────────────

    _resize() {
        if (!this.game) return;
        const isPortrait = this.scale.height > this.scale.width;
        this.game.size.isPortrait = isPortrait;
        this.game.size.resize();
    }
}
