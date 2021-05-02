import Phaser from 'phaser';
import Utils from '../classes/Utils';

import { GameScene } from '../scenes/GameScene';

/**
 * @extends Phaser.GameObjects.Sprite
 */
export class BasicProjectile extends Phaser.GameObjects.Sprite {
    /** @type {GameScene} To enforce type checking. */
    _scene;

    /** @protected @type {number} The speed of this projectile. */
    _speed;

    /** @protected @type {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} The velocity of the projectile. */
    _velocity;

    /** @protected @type {number} The damage of this projectile. */
    _damage;

    /** @protected @type {number} The range of this projectile (-1 for infinite). */
    _range;

    /** @protected @type {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} The previous coordinates. */
    _prev;

    /** @protected @type {number} The accumulated distance. */
    _distance = 0;

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
        type,
        scale = 1.0
    ) {
        super(scene, x, y, texture, frame);
        this._speed = speed;
        this._velocity = velocity;
        this._damage = damage;
        this._range = range;
        this.type = type;
        this._prev = { x, y };

        if (!(this.scene instanceof GameScene)) {
            throw new Error('Projectile: must be owned by a GameScene!');
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

        // normalize and scale the velocity by the speed
        this._velocity = new Phaser.Math.Vector2(this._velocity)
            .normalize()
            .scale(this._speed);

        // set initial velocity of this projectile
        this.body.setVelocity(this._velocity.x, this._velocity.y);
    }

    /**
     * @returns The speed of this projectile.
     */
    get speed() {
        return this._speed;
    }

    /**
     * @returns The current velocity of this projectile.
     */
    get velocity() {
        return this._velocity;
    }

    /**
     * Sets the velocity.
     * @param {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} velocity
     */
    set velocity(velocity) {
        this._velocity = new Phaser.Math.Vector2(velocity)
            .normalize()
            .scale(this._speed);
        this.body.setVelocity(this._velocity.x, this._velocity.y);
    }

    /**
     * @returns The damage of this projectile.
     */
    get damage() {
        return this._damage;
    }

    update() {
        // self-destroy when out-of-bound
        const width =
            this._scene.physics?.world?.bounds?.width ??
            this._scene.map.tilemap.widthInPixels;
        const height =
            this._scene.physics?.world?.bounds?.height ??
            this._scene.map.tilemap.heightInPixels;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.active = false;
            this.body?.setEnable(false);
            this.destroy();
        }

        // check if still within range
        if (this._range >= 0) {
            this._distance += Phaser.Math.Distance.BetweenPoints(
                this.body.center,
                this._prev
            );
            if (this._distance > this._range) {
                // call handler for out of range action
                this._handleOutOfRange();
            }
            // update previous coordinates
            this._prev = { x: this.body.center.x, y: this.body.center.y };
        }
    }

    /**
     * Must override to handle out of range with custom action.
     * Default action is destroy the projectile.
     * @protected
     */
    _handleOutOfRange() {
        this.active = false;
        this.body?.setEnable(false);
        Utils.fadeOutDestroy(this, 250);
    }
}
