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

    /**
     * Returns the mid point of two objects, relative to their center coordinates.
     * @param {Phaser.GameObjects.Components.GetBounds} object1 The first object.
     * @param {Phaser.GameObjects.Components.GetBounds} object2 The second object.
     * @returns {Phaser.Math.Vector2} The Vector2 object containing the mid point coordinates.
     */
    static midPointOf(object1, object2) {
        const { x: x1, y: y1 } = object1.getCenter();
        const { x: x2, y: y2 } = object2.getCenter();
        return new Phaser.Math.Vector2(
            Math.floor((x1 + x2) / 2),
            Math.floor((y1 + y2) / 2)
        );
    }

    /**
     * Returns the inclination (in radian) of object2 from object1, relative to their center coordinates.
     * @param {Phaser.GameObjects.Components.GetBounds} object1 The first object.
     * @param {Phaser.GameObjects.Components.GetBounds} object2 The second object.
     * @returns {number} The inclination (in radian).
     */
    static inclinationOf(object1, object2) {
        const { x: x1, y: y1 } = object1.getCenter();
        const { x: x2, y: y2 } = object2.getCenter();
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * Create a sprite at the given coordinates, play the specified animation and destroy it.
     * @param {Phaser.Scene} scene The scene to spawn the visual effect.
     * @param {number} x The x-coordinate of the visual effect.
     * @param {number} y The y-coordinate of the visual effect.
     * @param {string | Phaser.Textures.Texture} texture The texture for the sprite.
     * @param {Phaser.Types.Animations.Animation} animationConfig The animation configuration object.
     * @param {number} [rotation] The angle of the animation in radians with a right-hand clockwise system.
     */
    static spawnVisualEffect(scene, x, y, texture, animationConfig, rotation) {
        const sprite = scene.add.sprite(x, y, texture);
        sprite.setRotation(rotation);
        const animation = sprite.anims.create(animationConfig);
        if (!animation) {
            sprite.destroy();
            return;
        }
        sprite.play(animation, true);
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            sprite.destroy();
        });
    }
}
