import { BasicProjectile } from '../projectiles/BasicProjectile';
import { GameScene } from '../scenes/GameScene';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import { TrackProjectile } from '../projectiles/TrackProjectile';
import { FieldProjectile } from '../projectiles/FieldProjectile';
import Constants from './Constants';

export class ProjectileGenerator {
    /** @type {GameScene} To enforce type checking. */
    _scene;

    /** @type {string | Phaser.Textures.Texture} The texture of this projectile. */
    _texture;

    /** @type {string | number} The initial frame of this projectile. */
    _frame;

    /** @type {Phaser.GameObjects.GameObject} The owner of this projectile. */
    _owner;

    /** @protected @type {number} The x-coordinate of this projectile generator. */
    _x;

    /** @protected @type {number} The y-coordinate of this projectile generator. */
    _y;

    /** @protected @type {number} The scaling of this projectile generator. */
    _scale;

    /** @protected @type {number} The speed of this projectile. */
    _speed;

    /** @protected @type {number} The damage of this projectile. */
    _damage;

    /** @protected @type {number} The range of this projectile (-1 for infinite). */
    _range;

    /** @protected @type {number} The maximum number of the projectile instance (-1 for infinite). */
    _capacity;

    /** @protected @type {boolean} Flag indicating whether this projectile tracks enemies. */
    _isTrack;

    /** @protected @type {boolean} Flag indicating whether this projectile is a trap. */
    _isTrap;

    /** @protected @type {{isPoison: boolean, isSlow: boolean}} Flag indicating whether this projectile is a field and the effect. */
    _isField;

    /** @protected @type {number} The cooldown (in milleseconds) of this projectile. */
    _cooldown;

    /** @protected @type {boolean} The flag indicating if this projectile is on cooldown. */
    _isOnCooldown = false;

    /** @protected @type {BasicProjectile[]}} The history of projectile instances spawned. */
    _history = [];

    /** @type {Phaser.GameObjects.Sprite} The visual representation of this projectile generator. */
    sprite;

    /**
     * @param {Phaser.Scene} scene The Scene to which this projectile belongs.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this projectile will use to render with, as stored in the Texture Manager.
     * @param {string | number} frame The initial frame from the Texture this projectile is rendering with.
     * @param {Phaser.GameObjects.GameObject} owner The owner of this projectile.
     * @param {Types.ProjectileGeneratorConfig} [config] An optional config object containing the specified properties.
     */
    constructor(
        scene,
        texture,
        frame,
        owner,
        {
            x = 0,
            y = 0,
            scale = 1.0,
            speed = 96,
            cooldown = 500,
            damage = 1,
            range = -1,
            capacity = -1,
            isTrack = false,
            isTrap = false,
            isField = {
                isPoison: false,
                isSlow: false,
            },
        } = {}
    ) {
        if (!(scene instanceof GameScene)) {
            throw new Error(
                'ProjectileGenerator: must be owned by a GameScene!'
            );
        } else {
            this._scene = scene;
        }
        this._texture = texture;
        this._frame = frame;
        this._owner = owner;
        this._x = x;
        this._y = y;
        this._scale = scale;
        this._speed = speed;
        this._cooldown = cooldown;
        this._damage = damage;
        this._range = range;
        this._capacity = capacity;
        this._isTrack = isTrack;
        this._isTrap = isTrap;
        this._isField = isField;
        this.render();
    }

    /**
     * @returns The x-coordinate of this projectile generator.
     */
    get x() {
        return this.sprite.x;
    }

    /**
     * @returns The y-coordinate of this projectile generator.
     */
    get y() {
        return this.sprite.y;
    }

    /**
     * Sets the x-coordinate of this projectile generator.
     * @param {number} value The new value.
     */
    set x(value) {
        if (this.sprite === undefined) {
            return;
        }
        this.sprite.x = value;
    }

    /**
     * Sets the y-coordinate of this projectile generator.
     * @param {number} value The new value.
     */
    set y(value) {
        if (this.sprite === undefined) {
            return;
        }
        this.sprite.y = value;
    }

    /**
     * Create visual representation of projectile spawn location for player.
     */
    render() {
        if (
            this._owner instanceof PlayerCharacter &&
            this._owner.type === 'player'
        ) {
            this.sprite = this._scene.add.sprite(
                this._x,
                this._y,
                this._texture,
                this._frame
            );

            // hide the visual representation
            this.sprite.setVisible(false);

            // set the depth
            this.sprite.setDepth(this._owner.depth + 1);

            // set the scaling
            this.sprite.setScale(this._scale);

            // set the alpha
            this.sprite.setAlpha(0.3);
        }
    }

    /**
     * Spawn an instace of this projectile.
     * @param {number} destX The destination x-coordinate.
     * @param {number} destY The destination y-coordinate.
     * @param {number} srcX The source x-coordinate.
     * @param {number} srcY The source y-coordinate.
     */
    spawn(destX, destY, srcX = this.x, srcY = this.y) {
        if (this._isOnCooldown) {
            return;
        } else {
            this._isOnCooldown = true;
            this._scene.time.delayedCall(this._cooldown, () => {
                this._isOnCooldown = false;
            });
        }
        const angle = Math.atan2(destY - srcY, destX - srcX);
        const velocity = {
            x: this._speed * Math.cos(angle),
            y: this._speed * Math.sin(angle),
        };

        if (this._isField?.isPoison || this._isField?.isSlow) {
            const color = this._isField?.isPoison
                ? Constants.COLOR.POISON
                : Constants.COLOR.SLOW;
            this._history.push(
                new FieldProjectile(
                    this._scene,
                    srcX,
                    srcY,
                    this._texture,
                    this._frame,
                    this._speed,
                    velocity,
                    this._damage,
                    this._range,
                    this._capacity,
                    32,
                    5000,
                    color,
                    this._isField,
                    this._owner.type,
                    this._scale
                )
            );
        } else if (this._isTrack) {
            this._history.push(
                new TrackProjectile(
                    this._scene,
                    srcX,
                    srcY,
                    this._texture,
                    this._frame,
                    this._speed,
                    velocity,
                    this._damage,
                    this._range,
                    this._owner.type,
                    this._scale
                )
            );
        } else {
            this._history.push(
                new BasicProjectile(
                    this._scene,
                    srcX,
                    srcY,
                    this._texture,
                    this._frame,
                    this._speed,
                    velocity,
                    this._damage,
                    this._range,
                    this._owner.type,
                    this._scale
                )
            );
        }
    }

    /**
     * Destroy olderst projectile if exceeded capacity and remove destroyed projectiles from history.
     * @protected
     */
    _enforceCapacity() {
        // clean history
        for (let i = this._history.length - 1; i >= 0; --i) {
            const projectile = this._history[i];
            if (!projectile?.active || !projectile?.body?.enable) {
                this._history.splice(i, 1);
            }
        }

        // check capacity
        while (this._history.length > this._capacity) {
            this._history[0].destroy();
            this._history.splice(0, 1);
        }
    }
}
