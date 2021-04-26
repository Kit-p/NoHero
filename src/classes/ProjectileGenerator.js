import { BasicProjectile } from '../projectiles/BasicProjectile';
import { GameScene } from '../scenes/GameScene';
import { PlayerCharacter } from '../characters/PlayerCharacter';

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

    /** @type {number} The speed of this projectile. */
    _speed;

    /** @type {number} The damage of this projectile. */
    _damage;

    /** @type {Phaser.GameObjects.Sprite} The visual representation of this projectile generator. */
    _sprite;

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
        { x = 0, y = 0, scale = 1.0, speed = 96, damage = 1 } = {}
    ) {
        if (!(scene instanceof GameScene)) {
            throw new Error('Projectile: must be owned by a GameScene!');
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
        this._damage = damage;
        this.render();
    }

    /**
     * @returns The x-coordinate of this projectile generator.
     */
    get x() {
        return this._sprite.x;
    }

    /**
     * @returns The y-coordinate of this projectile generator.
     */
    get y() {
        return this._sprite.y;
    }

    /**
     * Sets the x-coordinate of this projectile generator.
     * @param {number} value The new value.
     */
    set x(value) {
        if (this._sprite === undefined) {
            return;
        }
        this._sprite.x = value;
    }

    /**
     * Sets the y-coordinate of this projectile generator.
     * @param {number} value The new value.
     */
    set y(value) {
        if (this._sprite === undefined) {
            return;
        }
        this._sprite.y = value;
    }

    /**
     * Create visual representation of projectile spawn location for player.
     */
    render() {
        if (
            this._owner instanceof PlayerCharacter &&
            this._owner.type === 'player'
        ) {
            this._sprite = this._scene.add.sprite(
                this._x,
                this._y,
                this._texture,
                this._frame
            );

            // set the depth
            this._sprite.setDepth(this._owner.depth + 10);

            // set the scaling
            this._sprite.setScale(this._scale);

            // set the alpha
            this._sprite.setAlpha(0.3);
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
        const angle = Math.atan2(destY - srcY, destX - srcX);
        const velocity = {
            x: this._speed * Math.cos(angle),
            y: this._speed * Math.sin(angle),
        };
        new BasicProjectile(
            this._scene,
            srcX,
            srcY,
            this._texture,
            this._frame,
            velocity,
            this._owner.type,
            this._scale
        );
    }
}
