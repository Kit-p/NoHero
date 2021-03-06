import Phaser from 'phaser';

import Utils from '../classes/Utils';
import Constants from '../classes/Constants';
import { Character } from '../classes/Character';
import { ProjectileGenerator } from '../classes/ProjectileGenerator';
import { HumanControlState } from '../states/HumanControlState';
import { WeakAIControlState } from '../states/WeakAIControlState';
import { Spike } from '../traps/Spike';

/**
 * @extends Character
 */
export class PlayerCharacter extends Character {
    // * Important Note: heart-to-health/damage ratio is 1:2. E.g. 1 heart = 2 health/damage

    /** @protected @type {boolean} Flag indicating whether the player is controlled by human. */
    _isHumanControlled = false;

    /** @protected @type {{human: HumanControlState, ai: WeakAIControlState}} Stores a copy of both control states for easy access. */
    _controlStates = {
        human: undefined,
        ai: undefined,
    };

    /** @protected @type {number} The current health of the player. */
    _health;

    /** @protected @type {number} The maximum health of the player. */
    _maxHealth;

    /** @protected @type {number} The damage applied for collide attack. */
    _collideAttackDamage;

    /** @protected @type {number} The damage applied for projectile attack. */
    _projectileAttackDamage;

    /** @protected @type {number} The duration of hit animation in milleseconds. */
    _hitAnimationDuration = 200;

    /** @protected @type {ProjectileGenerator[]} The projectiles available for this character. */
    _availableProjectiles = [];

    /** @type {ProjectileGenerator} The current projectile selected by this character. */
    currentProjectile;

    /** @type {Object.<string, number>} The cooldowns of various controls of this character. */
    _cooldowns;

    /** @type {boolean} Flag indicating if this character can move. */
    _canMove = true;

    /** @type {boolean} Flag indicating if this character is invulnerable. */
    _isInvulnerable = false;

    /** @type {number} The duration of invulnerability after taking damage in milleseconds. */
    _invulnerablePeriod = 300;

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
            movementSpeed = 64,
            maxHealth = 18,
            health = maxHealth,
            collideAttackDamage = 2,
            projectileDamage = 2,
            controlState = undefined,
            cooldowns = {
                projectile: 500,
                dash: 3000,
            },
            type = 'player',
        } = {}
    ) {
        super(scene, x, y, texture, frame, {
            name,
            movementSpeed,
            controlState,
            type,
        });

        if (this.controlState === undefined) {
            this._controlStates.human = new HumanControlState(
                this,
                cooldowns.dash
            );
            this._controlStates.ai = new WeakAIControlState(this);
            this.isHumanControlled = false;
        }

        this._maxHealth = maxHealth;
        this._health = health;
        this._collideAttackDamage = collideAttackDamage;
        this._projectileAttackDamage = projectileDamage;
        this._cooldowns = cooldowns;
        if (this.type === 'player') {
            this.body.pushable = false;
        }
        this._createProjectiles();
    }

    get isHumanControlled() {
        return this._isHumanControlled;
    }

    /**
     * @param {boolean} flag Flag indicating whether this character is human controlled.
     */
    set isHumanControlled(flag) {
        this._isHumanControlled = flag ? true : false;
        if (this._isHumanControlled) {
            this.currentProjectile?.sprite?.setVisible(true);
            this.controlState = this._controlStates.human;
        } else {
            this.currentProjectile?.sprite?.setVisible(false);
            this.controlState = this._controlStates.ai;
        }
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

    /**
     * @override
     */
    _createAnimations() {
        if (this.texture === null) {
            return;
        }
        let atlasKey = Constants.RESOURCE.ATLAS.ALL_IN_ONE_2;
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
            if (config.frames.length <= 0 || !this.anims.create(config)) {
                console.error(
                    `Animation creation failed for ${this.name}:${config.key}!`
                );
            }
        }

        // add delay for the transition from hit to idle/run
        this.anims.animationManager.addMix(
            'hit',
            'idle',
            this._hitAnimationDuration
        );
        this.anims.animationManager.addMix(
            'hit',
            'run',
            this._hitAnimationDuration
        );
    }

    /**
     * @override
     */
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

        if (this.currentProjectile !== undefined) {
            // update projectile generator position
            const radius = this.displayHeight / 2 + 15;
            const center = this.getCenter();
            let angle = Math.atan2(
                this.scene.input.mousePointer.y - center.y,
                this.scene.input.mousePointer.x - center.x
            );
            this.currentProjectile.x = center.x + Math.cos(angle) * radius;
            this.currentProjectile.y = center.y + Math.sin(angle) * radius;
        }
    }

    /**
     * Destroy the sprite and automatically perform garbage cleaning.
     */
    die() {
        // destroy projectile sprite
        this.currentProjectile?.sprite?.destroy();

        if (this === this._scene.currentHumanControlledCharacter) {
            // automatically switch character
            this._scene?.switchCharacter();
        }

        // play die audio
        const key =
            this.type === 'player'
                ? Constants.RESOURCE.AUDIO.PLAYER_DIE
                : Constants.RESOURCE.AUDIO.ENEMY_DIE;
        this._scene.sound.play(key, { volume: 0.5 });

        this._canMove = false;
        this.anims?.pause();
        this.scene?.tweens?.killTweensOf(this);

        // disable the physics body to ensure no collision leftover
        this.body?.setEnable(false);

        // fade out for 0.5s and destroy this character
        this.destroy(500);
    }

    /**
     * Take hit from an attacker, play hit animation if exist.
     * Decrease health by setting health as the decreased health.
     * @param {number} damage Amount of damage to be taken.
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} attacker The attacker object.
     * @param {boolean} toBounce Flag indicating if this character should be bounced.
     */
    takeHit(damage, attacker, toBounce = true) {
        if (damage <= 0 || this._isInvulnerable) {
            return;
        }

        // prevent continuous damage
        if (this?.collidedPhysicsObjects?.includes(attacker)) {
            return;
        }

        // make player invulnerable for specific duration
        this._isInvulnerable = true;
        this?._scene?.time?.delayedCall(
            this?._invulnerablePeriod,
            () => (this._isInvulnerable = false)
        );

        // disable movement
        this._canMove = false;
        this?._scene?.time?.delayedCall(
            this?._hitAnimationDuration,
            () => (this._canMove = true)
        );

        // play hurt audio
        let key;
        if (attacker instanceof Spike) {
            key = Constants.RESOURCE.AUDIO.SPIKE;
        } else if (attacker instanceof PlayerCharacter) {
            key = Constants.RESOURCE.AUDIO.SLASH;
        } else if (this.type === 'player') {
            key = Constants.RESOURCE.AUDIO.PLAYER_HURT;
        } else {
            key = Constants.RESOURCE.AUDIO.ENEMY_HURT;
        }
        this._scene.sound.play(key, { volume: 0.8 });

        // flash the character to white
        Utils.tintFill(
            this?.scene,
            this,
            this?._hitAnimationDuration,
            Constants.COLOR.HIT
        );

        if (toBounce) {
            // bounce the player
            let vec = new Phaser.Math.Vector2(
                this?.body?.x - attacker?.body?.x,
                this?.body?.y - attacker?.body?.y
            )
                .normalize()
                .scale(120);
            this?.body?.setVelocity(vec.x, vec.y);
            // reset velocity so this player does not bounce indefinitely
            this?.scene?.time?.delayedCall(this?._hitAnimationDuration, () => {
                this?.body?.setVelocity(0, 0);
            });
        }

        // play hit animation if exists
        if (this?.anims?.exists('hit')) {
            this?.anims?.play(
                {
                    key: 'hit',
                    duration: this?._hitAnimationDuration,
                },
                false
            );
        }
        if (this?.health === undefined) {
            return;
        }
        // decrease health with setter so no checking needed
        this.health -= damage;
    }

    /**
     * Heal the character by the specified amount.
     * @param {number} healing Amount of healing to be applied.
     */
    heal(healing) {
        if (healing <= 0) {
            return;
        }

        // play heal sound
        let key;
        if (healing > this._scene.potionHealing.small) {
            key = Constants.RESOURCE.AUDIO.HEAL_LARGE;
        } else {
            key = Constants.RESOURCE.AUDIO.HEAL_SMALL;
        }
        this._scene.sound.play(key, { volume: 0.3 });

        // flash the character to green
        Utils.tintFill(
            this.scene,
            this,
            this._hitAnimationDuration,
            Constants.COLOR.HEAL
        );

        // increase health with setter so no checking needed
        this.health += healing;
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
        const { x, y } = Utils.midPointOf(this, enemy);
        // play slash animation at mid point with correct rotation
        Utils.spawnVisualEffect(
            this.scene,
            x,
            y,
            Constants.RESOURCE.ATLAS.EFFECT_ATTACK_1,
            {
                key: 'normal_slash_white',
                duration: 100,
                repeat: 0,
                frames: this.anims.animationManager.generateFrameNames(
                    Constants.RESOURCE.ATLAS.EFFECT_ATTACK_1,
                    {
                        prefix: 'normal_slash_white_anim_f',
                        start: 1,
                        end: 5,
                    }
                ),
            },
            Utils.inclinationOf(enemy, this)
        );
        enemy.takeHit(this.collideAttackDamage, this);
    }

    /**
     * Create an array of available projectiles for this character.
     */
    _createProjectiles() {
        let projectile;
        switch (this.name) {
            case 'big_demon':
                projectile = new ProjectileGenerator(
                    this._scene,
                    Constants.RESOURCE.ATLAS.EFFECT_ATTACK_2,
                    'bullet_red_anim_f1',
                    this,
                    {
                        scale: 1,
                        speed: 32,
                        damage: this._projectileAttackDamage,
                        cooldown: this._cooldowns.projectile,
                        audio: {
                            key: Constants.RESOURCE.AUDIO.GUN_1,
                            extra: { volume: 0.4 },
                        },
                    }
                );
                break;
            case 'chort':
                projectile = new ProjectileGenerator(
                    this._scene,
                    Constants.RESOURCE.ATLAS.EFFECT_ATTACK_2,
                    'bullet_red_anim_f1',
                    this,
                    {
                        scale: 0.2,
                        speed: 64,
                        range: 32,
                        damage: this._projectileAttackDamage,
                        cooldown: this._cooldowns.projectile,
                        audio: {
                            key: Constants.RESOURCE.AUDIO.GUN_2,
                            extra: { volume: 0.3 },
                        },
                    }
                );
                break;
            case 'orc_shaman':
                projectile = new ProjectileGenerator(
                    this._scene,
                    Constants.RESOURCE.ATLAS.EFFECT_ATTACK_3,
                    'bullet_poison_anim_f1',
                    this,
                    {
                        scale: 0.5,
                        speed: 64,
                        range: 64,
                        capacity: 1,
                        damage: this._projectileAttackDamage,
                        cooldown: this._cooldowns.projectile,
                        isField: {
                            isPoison: true,
                            isSlow: false,
                        },
                        audio: {
                            key: Constants.RESOURCE.AUDIO.LASER_2,
                            extra: { volume: 0.4 },
                        },
                    }
                );
                break;
            case 'necromancer':
                projectile = new ProjectileGenerator(
                    this._scene,
                    Constants.RESOURCE.ATLAS.EFFECT_ATTACK_3,
                    'mine_purple_anim_f1',
                    this,
                    {
                        scale: 0.5,
                        speed: 128,
                        range: 0,
                        capacity: 1,
                        damage: this._projectileAttackDamage,
                        cooldown: this._cooldowns.projectile,
                        isField: {
                            isPoison: false,
                            isSlow: true,
                        },
                        audio: {
                            key: Constants.RESOURCE.AUDIO.FIELD,
                            extra: { volume: 0.4 },
                        },
                    }
                );
                break;
            case 'wogol':
                projectile = new ProjectileGenerator(
                    this._scene,
                    Constants.RESOURCE.ATLAS.EFFECT_ATTACK_3,
                    'shuriken_red_anim_f1',
                    this,
                    {
                        scale: 0.6,
                        speed: 96,
                        range: 96,
                        capacity: 2,
                        damage: this._projectileAttackDamage,
                        cooldown: this._cooldowns.projectile,
                        isTrap: true,
                        audio: {
                            key: Constants.RESOURCE.AUDIO.THROWABLE,
                            extra: { volume: 0.3 },
                        },
                    }
                );
                break;
            case 'wizard_m':
            case 'wizard_f':
                projectile = new ProjectileGenerator(
                    this._scene,
                    Constants.RESOURCE.ATLAS.EFFECT_ATTACK_3,
                    'bullet_glow_anim_f1',
                    this,
                    {
                        scale: 0.3,
                        speed: 128,
                        damage: this._projectileAttackDamage,
                        cooldown: this._cooldowns.projectile,
                        isTrack: true,
                        audio: {
                            key: Constants.RESOURCE.AUDIO.LASER_1,
                            extra: { volume: 0.3 },
                        },
                    }
                );
                break;
            default:
            // projectile = new ProjectileGenerator(
            //     this._scene,
            //     Constants.RESOURCE.ATLAS.EFFECT_ATTACK_2,
            //     'bullet_cyan_anim_f1',
            //     this,
            //     {
            //         x: 50,
            //         y: 50,
            //         scale: 0.3,
            //         speed: 128,
            //         damage: this._projectileAttackDamage,
            //         cooldown: this._cooldowns.projectile,
            //     }
            // );
        }

        if (projectile !== undefined) {
            this._availableProjectiles.push(projectile);
            this.currentProjectile = this._availableProjectiles[0];
        }
    }
}
