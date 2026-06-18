import Utils from "../core/framework/Utils";
import ParentScene from "../core/framework/components/Scene";
import SETTINGS from "../transition-screen-settings.json";
import Helper from "./Helper";

/**
 * TransitionScene
 * ---------------
 * Shown between gameplay levels. Displays a header and one text button per
 * available scene. Clicking a button starts that scene.
 *
 * Scene labels come from transition-screen-settings.json → sceneButtonLabels.
 * Add a label entry for every scene id that appears in the flow.
 */

export default class TransitionScene extends ParentScene {
    constructor() {
        super('TransitionScene');
    }

    create() {
        if (this.mainContainer) {
            this._helper?.kill();
            this._helper = null;
            this._isTransitioning = false;
            this.mainContainer.removeAll(true);
        }

        this._buildUI();

        setTimeout(() => {
            this._resize();
            this.scale.on('resize', () => setTimeout(() => this._resize(), 200));
        }, 50);

        this.events.once('shutdown', () => {
            this._helper?.kill();
            this.scale.removeAllListeners('resize');
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UI construction
    // ─────────────────────────────────────────────────────────────────────────

    _buildUI() {
        let available = window.App.stateManager.getAvailableScenes();
        if (window.App.isDev && SETTINGS.devLevelButtons && typeof SETTINGS.devLevelButtons === 'object') {
            available = Object.keys(SETTINGS.devLevelButtons).filter((id) => SETTINGS.devLevelButtons[id]);
        }

        // Background
        const background = this.add.graphics();
        const bgColor = (SETTINGS.background && SETTINGS.background.color) ? SETTINGS.background.color : '#111111';
        const bgAlpha = (SETTINGS.background && typeof SETTINGS.background.alpha === 'number') ? SETTINGS.background.alpha : 1;
        background.fillStyle(parseInt(bgColor.replace('#', ''), 16), bgAlpha);
        background.fillRect(-3000, -3000, 6000, 6000);
        background.setCustomPosition(0, 0);
        background.setDepth(SETTINGS.uiDepth - 1);
        this.mainContainer.add(background);

        // Title
        const titleStyle = {
            fontFamily:      SETTINGS.title.fontFamily,
            fontSize:        SETTINGS.title.fontSize,
            fontStyle:       SETTINGS.title.fontStyle,
            color:           SETTINGS.title.color,
            stroke:          SETTINGS.title.stroke,
            strokeThickness: SETTINGS.title.strokeThickness,
            align:           SETTINGS.title.align
        };
        if (typeof SETTINGS.title.maxWidth === 'number') {
            titleStyle.wordWrap = { width: SETTINGS.title.maxWidth, useAdvancedWrap: true };
        }

        const title = this.add.text(0, 0, SETTINGS.title.text, titleStyle)
            .setOrigin(0.5, 0.5)
            .setDepth(SETTINGS.uiDepth);
        title.addProperties(['pos']);
        title.px = 0; title.py = SETTINGS.title.y;
        title.lx = 0; title.ly = SETTINGS.title.y;
        this.mainContainer.add(title);

        // Scene buttons — text-based, no textures required
        const count      = available.length;
        const totalWidth = (count - 1) * SETTINGS.buttons.spacing;
        const startX     = -totalWidth / 2;

        this._buttons = [];

        available.forEach((sceneId, i) => {
            const label    = SETTINGS.sceneButtonLabels?.[sceneId] || sceneId;
            const bx       = startX + i * SETTINGS.buttons.spacing;
            const btnScale = SETTINGS.buttons.scale ?? 1;
            const introDelay = i * (SETTINGS.buttons.introStaggerMs ?? 80);

            const btn = this.add.text(0, 0, label, {
                fontFamily:      SETTINGS.buttons.labelFontFamily || SETTINGS.title.fontFamily,
                fontSize:        SETTINGS.buttons.labelFontSize    || '36px',
                color:           SETTINGS.buttons.labelColor       || '#ffffff',
                stroke:          SETTINGS.buttons.labelStroke      || '#000000',
                strokeThickness: SETTINGS.buttons.labelStrokeThickness ?? 4,
                backgroundColor: 'rgba(0,0,0,0.4)',
                padding:         { x: 36, y: 18 },
                align:           'center'
            })
                .setOrigin(0.5, 0.5)
                .setScale(btnScale * 0.8)
                .setAlpha(0)
                .setDepth(SETTINGS.uiDepth)
                .setInteractive({ useHandCursor: true });

            btn.addProperties(['pos']);
            btn.px = bx; btn.py = SETTINGS.buttons.y;
            btn.lx = bx; btn.ly = SETTINGS.buttons.y;
            this.mainContainer.add(btn);
            this._buttons.push(btn);

            // Intro animation
            this.tweens.add({
                targets:  btn,
                alpha:    1,
                scaleX:   btnScale,
                scaleY:   btnScale,
                duration: SETTINGS.buttons.introDurationMs ?? 400,
                ease:     'Bounce.Out',
                delay:    introDelay
            });

            btn.on('pointerover', () => {
                const hs = btnScale * (SETTINGS.buttons.hoverScale ?? 1.08);
                this.tweens.add({ targets: btn, scaleX: hs, scaleY: hs,
                    duration: SETTINGS.buttons.tweenDurationMs ?? 120, ease: SETTINGS.buttons.tweenEase ?? 'Power2' });
            });
            btn.on('pointerout', () => {
                this.tweens.add({ targets: btn, scaleX: btnScale, scaleY: btnScale,
                    duration: SETTINGS.buttons.tweenDurationMs ?? 120, ease: SETTINGS.buttons.tweenEase ?? 'Power2' });
            });
            btn.on('pointerdown', () => {
                Utils.addAudio(this, 'click', 1.5);
                this._selectScene(sceneId, btn);
            });
        });

        this._helper = new Helper({ scene: this, container: this.mainContainer });
        this._helper.startLevelSelect(this._buttons);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Selection handler
    // ─────────────────────────────────────────────────────────────────────────

    _selectScene(sceneId, clickedButton) {
        if (this._isTransitioning) return;
        this._isTransitioning = true;
        this._helper?.kill();
        this._helper = null;

        if (this._buttons) {
            this._buttons.forEach((btn) => btn.disableInteractive());
        }

        const targetScale = SETTINGS.buttons.scale * (SETTINGS.buttons.clickScaleDown ?? 0.9);
        this.tweens.add({
            targets:  clickedButton,
            scaleX:   targetScale,
            scaleY:   targetScale,
            duration: SETTINGS.buttons.clickScaleDurationMs ?? 100,
            yoyo:     true,
            ease:     'Power1.Out'
        });

        this.time.delayedCall((SETTINGS.buttons.clickScaleDurationMs ?? 100) * 2, () => {
            this.tweens.add({
                targets:    this.mainContainer,
                alpha:      0,
                duration:   SETTINGS.buttons.fadeOutDurationMs ?? 300,
                ease:       'Power1.Out',
                onComplete: () => { this.scene.start('Game', { sceneId }); }
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Resize
    // ─────────────────────────────────────────────────────────────────────────

    _resize() {
        const isPortrait = this.scale.height > this.scale.width;
        this.game.size.isPortrait = isPortrait;
        this.game.size.resize();
    }
}
