import Phaser from 'phaser';

import { GameScene } from '../scenes/GameScene';

/**
 * @extends Phaser.GameObjects.Sprite
 */
export class Spike extends Phaser.GameObjects.Sprite {
    /** @type {GameScene} To enforce type checking. */
    _scene;

    /** @protected @type {number} The damage of this projectile. */
    _damage;

    /** @protected @type {boolean} A flag indicating whether the spike is in damaging state (dependent on animation frame). */
    _isDamaging = false;

    /** @property @type {number} The rate of spike thrusting (frame rate). */
    _rate = 4;

    /**
     * @param {Phaser.Scene} scene The Scene to which this spike belongs.
     * @param {number} x The initial x-coordinate of this spike.
     * @param {number} y The initial y-coordinate of this spike.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this spike will use to render with, as stored in the Texture Manager.
     * @param {string | number} [frame] The initial frame from the Texture this spike is rendering with.
     * @param {number} [damage] The damage of this spike.
     * @param {string} [type] The type of PlayerCharacter this spike belongs to.
     */
    constructor(
        scene,
        x,
        y,
        texture,
        damage = 1,
        frame = 'floor_spikes_anim_f0',
        type = 'spike'
    ) {
        super(scene, x, y, texture, frame);
        this._damage = damage;
        this.type = type;

        if (!(this.scene instanceof GameScene)) {
            throw new Error('Spike: must be owned by a GameScene!');
        } else {
            this._scene = this.scene;
        }

        // add this spike to the scene and the physics plugin
        this._scene.spikeGroup.add(this, true);
        if (!(this.body instanceof Phaser.Physics.Arcade.Body)) {
            /** @type {Phaser.Physics.Arcade.Body} */
            this.body = new Phaser.Physics.Arcade.Body(
                this.scene.physics.world,
                this
            );
        }

        // set collision size
        this.body.setCircle((this.displayWidth / 2) * 0.5, 4, 4);

        // create animation
        this.anims.create({
            key: 'thrust',
            frameRate: this._rate,
            repeat: -1,
            yoyo: true,
            frames: this.anims.generateFrameNames(this.texture.key, {
                prefix: 'floor_spikes_anim_f',
                start: 0,
                end: 3,
            }),
        });

        // play the animation
        this.anims.play('thrust');
    }

    /**
     * @returns The damage of this spike.
     */
    get damage() {
        return this._damage;
    }

    /**
     * @returns The flag indicating whether this spike is in damaging state.
     */
    get isDamaging() {
        return this._isDamaging;
    }

    update() {
        // set the is damaging state according to the current frame
        const currentFrameName = this.anims.currentFrame.frame.name;
        this._isDamaging =
            currentFrameName.endsWith('2') || currentFrameName.endsWith('3');
    }
}
