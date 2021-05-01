import { BasicProjectile } from './BasicProjectile';

/**
 * @extends BasicProjectile
 */
export class TrackProjectile extends BasicProjectile {
    /**
     * @param {Phaser.Scene} scene The Scene to which this projectile belongs.
     * @param {number} x The initial x-coordinate of this projectile.
     * @param {number} y The initial y-coordinate of this projectile.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this projectile will use to render with, as stored in the Texture Manager.
     * @param {string | number} frame The initial frame from the Texture this projectile is rendering with.
     * @param {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} velocity The velocity of this projectile.
     * @param {number} damage The damage of this projectile.
     * @param {string} type The type of PlayerCharacter this projectile belongs to.
     * @param {number} [scale] The scaling of this projectile.
     */
    constructor(
        scene,
        x,
        y,
        texture,
        frame,
        velocity,
        damage,
        type,
        scale = 1.0
    ) {
        super(scene, x, y, texture, frame, velocity, damage, type, scale);
    }

    update() {
        super.update();

        // TODO: track enemy
    }
}
