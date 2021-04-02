import Phaser from 'phaser';

export default class Utils {
    /**
     * Replacement method for `Phaser.GameObjects.GameObject.destroy()`.
     * Add a duration of fade out before destroying the object.
     * @param {Phaser.GameObjects.GameObject} gameObject The game object to be destroyed.
     * @param {number} [duration] The duration of fade out in milleseconds.
     */
    static fadeOutDestroy(gameObject, duration = 500) {
        if (
            !(gameObject instanceof Phaser.GameObjects.GameObject) ||
            !(gameObject.scene instanceof Phaser.Scene)
        ) {
            return;
        }
        // disable game object during fade out effect
        gameObject.active = false;
        // play fade out effect and destroy the game object
        gameObject.scene.tweens.add({
            targets: gameObject,
            alpha: 0,
            delay: 0,
            duration: duration,
            ease: 'Linear',
            yoyo: false,
            repeat: 0,
            onComplete: () => {
                gameObject.destroy();
            },
        });
    }
}
