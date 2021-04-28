import Phaser from 'phaser';

import { GameScene } from '../scenes/GameScene';

/**
 * @extends Phaser.GameObjects.Sprite
 */
export class BasicProjectile extends Phaser.GameObjects.Sprite {
    /**
     * @type {GameScene} To enforce type checking.
     */
    _scene;

    /**
     * @protected @type {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} The velocity of the projectile.
     */
    _velocity;

    /**
     * @protected @type {number} The damage of this projectile.
     */
    _damage;

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
        super(scene, x, y, texture, frame);
        this._velocity = velocity;
        this._damage = damage;
        this.type = type;

        if (!(this.scene instanceof GameScene)) {
            throw new Error('Character: must be owned by a GameScene!');
        } else {
            this._scene = this.scene;
        }

        // add this projectile to the scene and the physics plugin
        this._scene.projectileGroup.add(this, true);
        if (!(this.body instanceof Phaser.Physics.Arcade.Body)) {
            /** @type {Phaser.Physics.Arcade.Body} */
            this.body = new Phaser.Physics.Arcade.Body(
                this.scene.physics.world,
                this
            );
        }

        // set collision size
        this.body.setCircle(this.displayWidth / 2);

        // set the scaling
        this.setScale(scale);

        // set initial velocity of this projectile
        this.body.setVelocity(this._velocity.x, this._velocity.y);
    }

    /**
     * @returns The current velocity of this projectile.
     */
    get velocity() {
        return this._velocity;
    }

    /**
     * @returns The damage of this projectile.
     */
    get damage() {
        return this._damage;
    }

    update() {
        // self-destroy when out-of-bound
        if (
            this.x < 0 ||
            this.x > this._scene.physics.world.bounds.width ||
            this.y < 0 ||
            this.y > this._scene.physics.world.bounds.height
        ) {
            this.active = false;
            this.body?.setEnable(false);
            this.destroy();
        }
    }
}
