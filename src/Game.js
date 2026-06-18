import ParentScene from "../core/framework/components/Scene";
import Background from "./Background";
import Logo from "./Logo";
import Button from "./Button";
import GameStartedText from "./GameStartedText";

export default class Game extends ParentScene {
    create() {
        this.initScene();
    }

    initScene() {
        this.bg = new Background({
            scene: this,
            pImage: "main_bg", lImage: "main_bg",
            pScaleX: 1.05, pScaleY: 1.05,
            lScaleX: 2.1,  lScaleY: 2.1,
            container: this.mainContainer
        });

        this.logo = new Logo({
            scene: this,
            texture: "logo",
            px: 0, py: 80,
            lx: 0, ly: 60,
            pScaleX: 0.8, pScaleY: 0.8,
            lScaleX: 0.8, lScaleY: 0.8,
            align: "Top",
            container: this.mainContainer
        });

        this.gameStartedText = new GameStartedText({
            scene: this,
            container: this.mainContainer
        });

        this.ctaButton = new Button({
            scene: this,
            texture: "btnFin",
            px: 0, py: -80,
            lx: 0, ly: -60,
            pScaleX: 0.6, pScaleY: 0.6,
            lScaleX: 0.6, lScaleY: 0.6,
            align: "Bottom",
            container: this.mainContainer,
            callback: () => this.onCta()
        });
        this.ctaButton.setAlpha(0);

        this.startButton = new Button({
            scene: this,
            texture: "start_btn",
            px: 0, py: -80,
            lx: 0, ly: -60,
            pScaleX: 0.6, pScaleY: 0.6,
            lScaleX: 0.6, lScaleY: 0.6,
            align: "Bottom",
            container: this.mainContainer,
            callback: () => this.onStart()
        });

        setTimeout(() => {
            this.resizeSquare(this.scale.height / this.scale.width);
            this.scale.on("resize", () => {
                setTimeout(() => {
                    this.resizeSquare(this.scale.height / this.scale.width);
                }, 11);
            });
        }, 11);
    }

    onStart() {
        this.startButton.animate({ alpha: 0, duration: 200 });
        this.gameStartedText.show();

        this.time.addEvent({
            delay: 2000,
            callback: () => {
                this.gameStartedText.hide();
                this.ctaButton.animate({ alpha: 1, duration: 300 });
            }
        });
    }

    onCta() {
        window.App.network.ctaClick();
    }

    resizeSquare(ratio) {
        const isPortrait = this.scale.height > this.scale.width;
        this.game.size.isPortrait = isPortrait;
        this.game.size.resize();
    }
}
