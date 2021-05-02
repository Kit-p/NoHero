import Phaser from 'phaser';

import Utils from '../classes/Utils';
import { BasicProjectile } from './BasicProjectile';

/**
 * @extends BasicProjectile
 */
export class TrapProjectile extends BasicProjectile {
    /**
     * @param {Phaser.Scene} scene The Scene to which this projectile belongs.
     * @param {number} x The initial x-coordinate of this projectile.
     * @param {number} y The initial y-coordinate of this projectile.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this projectile will use to render with, as stored in the Texture Manager.
     * @param {string | number} frame The initial frame from the Texture this projectile is rendering with.
     * @param {number} speed The speed of this projectile.
     * @param {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} velocity The velocity of this projectile.
     * @param {number} damage The damage of this projectile.
     * @param {number} range The range of this projectile (-1 for infinite).
     * @param {number} capacity The maximum number of this trap instance (-1 for infinite).
     * @param {number} duration The duration of the trap spawned by this projectile.
     * @param {string} type The type of PlayerCharacter this projectile belongs to.
     * @param {number} [scale] The scaling of this projectile.
     */
    constructor(
        scene,
        x,
        y,
        texture,
        frame,
        speed,
        velocity,
        damage,
        range,
        capacity,
        duration,
        type,
        scale = 1.0
    ) {
        super(
            scene,
            x,
            y,
            texture,
            frame,
            speed,
            velocity,
            damage,
            range,
            type,
            scale
        );

        if (capacity >= 0) {
            // remove existing traps if exceeded capacity
            const traps = this._scene.projectileGroup
                .getChildren()
                .filter((projectile) => projectile instanceof TrapProjectile);

            for (let i = 0; i <= traps.length - capacity; ++i) {
                const trap = traps[i];
                if (!(trap.body instanceof Phaser.Physics.Arcade.Body)) {
                    continue;
                }
                trap.body?.setEnable(false);
                Utils.fadeOutDestroy(traps[i], 250);
            }
        }

        if (duration >= 0) {
            // destroy trap if exceeded duration
            this._scene.time.delayedCall(duration, () => {
                if (this !== undefined) {
                    this.body?.setEnable(false);
                    Utils.fadeOutDestroy(this, 250);
                }
            });
        }
    }

    /**
     * @override
     */
    update() {
        super.update();
        this.angle += 5;
    }

    /**
     * @override
     */
    _handleOutOfRange() {
        // stop the projectile
        this.body.setVelocity(0, 0);
        this.body.setMaxVelocity(0, 0);
    }
}
