import Phaser from 'phaser';

import Character from '../classes/Character';

export default class PlayerCharacter extends Character {
    // * Important Note: heart-to-health/damage ratio is 1:2. E.g. 1 heart = 2 health/damage

    /** @type {number} The current health of the player. */
    _health;

    /** @type {number} The maximum health of the player. */
    _maxHealth;

    /** @type {number} The damage applied for collide attack. */
    _collideAttackDamage;

    /**
     * @param {Phaser.Scene} scene The Scene to which this character belongs.
     * @param {number} x The initial x-coordinate of the character.
     * @param {number} y The initial y-coordinate of the character.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this character will use to render with, as stored in the Texture Manager.
     * @param {string | number} [frame] An optional frame from the Texture this character is rendering with.
     * @param {Types.PlayerCharacterConfig} [config] An optional config object containing the specified properties.
     */
    constructor(
        scene,
        x,
        y,
        texture,
        frame,
        {
            name = 'elf_m',
            isHumanControlled = true,
            movementSpeed = 64,
            maxHealth = 6,
            health = maxHealth,
            collideAttackDamage = 2,
            controls = Character.DefaultControls,
            type = 'player',
        } = {}
    ) {
        super(scene, x, y, texture, frame, {
            name,
            isHumanControlled,
            movementSpeed,
            controls,
            type,
        });
        this._maxHealth = maxHealth;
        this._health = health;
        this._collideAttackDamage = collideAttackDamage;
    }

    get maxHealth() {
        return this._maxHealth;
    }

    /**
     * @param {number} value The new maximum health.
     */
    set maxHealth(value) {
        // lowest maximum health is 1 heart
        if (isNaN(value) || value < 2) {
            value = 2;
        }
        // highest maximum health is 10 heart
        if (!isFinite(value) || value > 20) {
            value = 20;
        }
        // maximum health must be an even integer number
        if (!Number.isInteger(value)) {
            value = Math.floor(value);
        }
        if (value % 2 !== 0) {
            value += 1;
        }
        this._maxHealth = value;
    }

    get health() {
        return this._health;
    }

    /**
     * Calls this.die() if new health ends up being 0.
     * @param {number} value The new health.
     */
    set health(value) {
        // lowest health is 0 heart
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        // highest health is the character's maximum health
        if (!isFinite(value) || value > this.maxHealth) {
            value = this.maxHealth;
        }
        // health must be an integer number
        if (!Number.isInteger(value)) {
            value = Math.floor(value);
        }
        this._health = value;
        if (this._health <= 0) {
            this.die();
        }
    }

    get collideAttackDamage() {
        return this._collideAttackDamage;
    }

    /**
     * @param {number} value The new damage to be applied for collide attack.
     */
    set collideAttackDamage(value) {
        this._collideAttackDamage = value;
    }

    _createAnimations() {
        if (this.texture === null) {
            return;
        }
        let atlasKey = 'atlas_all-in-one-2';
        if (typeof this.texture === 'string') {
            atlasKey = this.texture;
        } else if (this.texture instanceof Phaser.Textures.Texture) {
            atlasKey = this.texture.key;
        }
        /** @type {Phaser.Types.Animations.Animation[]} */
        const animationConfigs = [
            {
                key: 'idle',
                frameRate: 4,
                repeat: -1,
                frames: this.anims.generateFrameNames(atlasKey, {
                    prefix: `${this.name}_idle_anim_f`,
                    start: 0,
                    end: 3,
                }),
            },
            {
                key: 'run',
                frameRate: 8,
                repeat: -1,
                frames: this.anims.generateFrameNames(atlasKey, {
                    prefix: `${this.name}_run_anim_f`,
                    start: 0,
                    end: 3,
                }),
            },
            {
                key: 'hit',
                frameRate: 1,
                repeat: -1,
                frames: this.anims.generateFrameNames(atlasKey, {
                    prefix: `${this.name}_hit_anim_f`,
                    start: 0,
                    end: 0,
                }),
            },
        ];

        for (const config of animationConfigs) {
            if (!this.anims.create(config)) {
                console.error(
                    `Animation creation failed for ${this.name}:${config.key}!`
                );
            }
        }
    }

    update() {
        // parent class handles basic movements
        super.update();

        // update animation
        if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
            this.anims.play('idle', true);
        } else {
            this.anims.play(
                {
                    key: 'run',
                    frameRate: (this._movementSpeed / 32) * 4, // * subject to change
                },
                true
            );
        }
    }

    /**
     * Destroy the sprite and automatically perform garbage cleaning.
     */
    die() {
        // fade out for 0.5s and destroy this character
        this.destroy(500);
    }

    /**
     * Take hit from an attacker, play hit animation if exist.
     * Decrease health by setting health as the decreased health.
     * @param {number} damage Amount of damage to be taken.
    //  * param {} attacker The attacker object.
     */
    takeHit(damage) {
        // set flash and animation duration to 0.1s
        const hitAnimationDuration = 100;
        // flash the character to white
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(
            hitAnimationDuration,
            () => this.clearTint(),
            [],
            this
        );
        // play hit animation
        this.anims.play(
            {
                key: 'hit',
                duration: hitAnimationDuration,
            },
            false
        );
        // decrease health with setter so no checking needed
        this.health -= damage;
    }

    /**
     * Handle attacking enemy on collision, play animation and damage enemy.
     //  * param {Phaser.Types.Physics.Arcade.GameObjectWithBody} enemy The enemy to attack.
     * @param {PlayerCharacter} enemy The enemy to attack.
     */
    collideAttacks(enemy) {
        if (this.collidedPhysicsObjects.includes(enemy)) {
            return;
        }
        // TODO: play slash animation
        enemy.takeHit(this.collideAttackDamage);
    }
}
