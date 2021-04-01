import Phaser from 'phaser';

import Character from '../classes/Character';

export default class PlayerCharacter extends Character {
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
}
