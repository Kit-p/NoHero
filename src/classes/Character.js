import Phaser from 'phaser';

export default class Character extends Phaser.GameObjects.GameObject {
    /** @type {boolean} */
    _isImmortal = false;

    /** @type {number} */
    _maxHealth = NaN;

    /** @type {number} */
    _health = NaN;

    /** @type {{x: number, y: number}} */
    _coordinates;

    /** @type {string | Phaser.Textures.Texture} */
    _texture = null;

    /** @type {Phaser.GameObjects.Sprite} */
    _sprite = null;

    /** @type {{name: string, animation: Phaser.Animations.Animation}[]} */
    _animations = [];

    /**
     * @param {Phaser.Scene} scene The Scene to which this character belongs.
     * @param {number} x The initial x-coordinate of the character.
     * @param {number} y The initial y-coordinate of the character.
     * @param {string} name The name of the character.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this character will use to render with, as stored in the Texture Manager.
     * @param {string | number} frame An optional frame from the Texture this character is rendering with.
     * @param {string} type A textual representation of the type of character, i.e. sprite.
     */
    constructor(
        scene,
        x,
        y,
        name = '',
        texture = null,
        frame = null,
        type = 'character'
    ) {
        super(scene, type);
        this.name = name;
        this.coordinates = { x, y };
        if (texture !== null) {
            this._texture = texture;
            let sprite;
            if (frame !== null) {
                sprite = this.scene.add.sprite(x, y, texture, frame);
            } else {
                sprite = this.scene.add.sprite(x, y, texture);
            }
            this._sprite = sprite;
        }
        this._prepareAnimations();
    }

    get isImmortal() {
        return this._isImmortal;
    }

    /**
     * @param {boolean} flag The value to set.
     */
    set isImmortal(flag) {
        this._isImmortal = flag ? true : false;
    }

    get maxHealth() {
        return this._maxHealth;
    }

    /**
     * @param {number} value The value to set.
     */
    set maxHealth(value) {
        if (isNaN(value) || !isFinite(value)) {
            value = NaN;
        } else {
            if (value > Number.MAX_SAFE_INTEGER) {
                value = Number.MAX_SAFE_INTEGER;
            } else if (value <= 0) {
                value = NaN;
            }
        }
        this._maxHealth = value;
        if (isNaN(value)) {
            this.health = NaN;
        } else if (this.health > value) {
            this.health = value;
        }
    }

    get health() {
        return this._health;
    }

    /**
     * @param {number} value The value to set.
     */
    set health(value) {
        if (isNaN(value) || !isFinite(value)) {
            value = NaN;
        } else {
            if (value > this.maxHealth) {
                value = this.maxHealth;
            } else if (value < 0) {
                value = 0;
            }
        }
        this._health = value;
    }

    get x() {
        return this._coordinates.x;
    }

    /**
     * @param {number} value The value to set.
     */
    set x(value) {
        // TODO: validate value
        this._coordinates.x = value;
    }

    get y() {
        return this._coordinates.y;
    }

    /**
     * @param {number} value The value to set.
     */
    set y(value) {
        // TODO: validate value
        this._coordinates.y = value;
    }

    get texture() {
        return this._texture;
    }

    get sprite() {
        return this._sprite;
    }

    get animations() {
        return this._animations;
    }

    /**
     * @returns {boolean} Whether the character is alive.
     */
    get isAlive() {
        return this.isImmortal || this.health <= 0;
    }

    /**
     * Override this function to populate the animations array here.
     */
    _prepareAnimations() {}

    /**
     * Play the animation of specified key.
     * @param {string | Phaser.Animations.Animation | Phaser.Types.Animations.PlayAnimationConfig} key The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object.
     * @param {boolean} ignoreIfPlaying If an animation is already playing then ignore this call. Default false.
     * @returns {boolean} True if successfully called `Phaser.GameObjects.Sprite.play`, otherwise false.
     */
    animate(key, ignoreIfPlaying = false) {
        if (!(this.sprite instanceof Phaser.GameObjects.Sprite)) {
            return false;
        }
        let animationToPlay;
        try {
            let searchKey;
            if (typeof key === 'string') {
                searchKey = (
                    /** @type {{name: string, animation: Phaser.Animations.Animation}} */ animation
                ) => animation.name === key || animation.animation.key === key;
            } else if (key instanceof Phaser.Animations.Animation) {
                searchKey = (
                    /** @type {{name: string, animation: Phaser.Animations.Animation}} */ animation
                ) =>
                    animation.name === key.key ||
                    animation.animation.key === key.key;
            } else if (typeof key.key === 'string') {
                searchKey = (
                    /** @type {{name: string, animation: Phaser.Animations.Animation}} */ animation
                ) =>
                    animation.name === key.key ||
                    animation.animation.key === key.key;
            } else if (key.key instanceof Phaser.Animations.Animation) {
                const key_tmp = key.key;
                searchKey = (
                    /** @type {{name: string, animation: Phaser.Animations.Animation}} */ animation
                ) =>
                    animation.name === key_tmp.key ||
                    animation.animation.key === key_tmp.key;
            }
            const result = this.animations.find(searchKey);
            if (result === undefined || result === null) {
                return false;
            } else {
                animationToPlay = result.animation;
            }
        } catch (err) {
            console.error(err);
            return false;
        }
        this.sprite.play(animationToPlay, ignoreIfPlaying);
        return true;
    }
}
