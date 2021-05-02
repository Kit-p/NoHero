import { Field } from '../traps/Field';
import { BasicProjectile } from './BasicProjectile';

/**
 * @extends BasicProjectile
 */
export class FieldProjectile extends BasicProjectile {
    /** @protected @type {number} The maximum number of this field instance. */
    _capacity;

    /** @protected @type {number} The radius of the field spawned by this projectile. */
    _radius;

    /** @protected @type {number} The duration of the field spawned by this projectile. */
    _duration;

    /** @protected @type {number} The color of the field spawned by this projectile. */
    _color;

    /** @protected @type {{isPoison: boolean, isSlow: boolean}} The effect of this projectile. */
    _effects;

    /** @protected @type {boolean} Flag indicating if this projectile has spawned a field. */
    _hasSpawned = false;

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
     * @param {number} capacity The maximum number of this field instance (-1 for infinite).
     * @param {number} radius The radius of the field spawned by this projectile.
     * @param {number} duration The duration of the field spawned by this projectile.
     * @param {number} color The color of the field spawned by this projectile.
     * @param {{isPoison: boolean, isSlow: boolean}} effects The effect of this projectile.
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
        radius,
        duration,
        color,
        effects,
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
        this._capacity = capacity;
        this._radius = radius;
        this._duration = duration;
        this._color = color;
        this._effects = effects;
    }

    /**
     * @override
     */
    _handleOutOfRange() {
        if (!this._hasSpawned) {
            // spawn field
            this._hasSpawned = true;
            new Field(
                this._scene,
                this.body.center.x,
                this.body.center.y,
                this.type,
                this._capacity,
                this._radius,
                this._damage,
                this._effects,
                this._color,
                this._duration
            );
        }

        // fade-out destroy this projectile
        super._handleOutOfRange();
    }
}
