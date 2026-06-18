export default class Scene extends Phaser.Scene {
    constructor(name = 'Game') {
        super({key: name});
    }
  
    preload() {
        this.mainContainer = this.add.container(0, 0);
        this.game.size.resize();

        // Only mute on the very first load. On subsequent level restarts the
        // user has already interacted, so muting would cut the background music.
        if (!window.App.userInteracted) {
            this.sound.mute = true;
            this.input.once('pointerdown', () => {
                this.sound.mute = false;
                window.App.userInteracted = true;
            });
        }
    }

    sort() {
        this.mainContainer.sort('depth');
    }
}