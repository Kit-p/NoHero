import Phaser from 'phaser';

import Character from '../classes/Character';

export default class PlayerCharacter extends Character {
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
        name = 'elf_m',
        texture = null,
        frame = null,
        type = 'player'
    ) {
        super(scene, x, y, name, texture, frame, type);
    }

    _prepareAnimations() {
        if (this.texture === null) {
            return;
        }
        let atlasKey = 'atlas_all-in-one-2';
        if (typeof this.texture === 'string') {
            atlasKey = this.texture;
        } else if (this.texture instanceof Phaser.Textures.Texture) {
            atlasKey = this.texture.key;
        }
        const animations = {
            idle: {
                key: `${this.name}_idle_anim`,
                frameRate: 4,
                repeat: -1,
                frames: this.scene.anims.generateFrameNames(atlasKey, {
                    prefix: `${this.name}_idle_anim_f`,
                    start: 0,
                    end: 3,
                }),
            },
            run: {
                key: `${this.name}_run_anim`,
                frameRate: 4,
                repeat: -1,
                frames: this.scene.anims.generateFrameNames(atlasKey, {
                    prefix: `${this.name}_run_anim_f`,
                    start: 0,
                    end: 3,
                }),
            },
            hit: {
                key: `${this.name}_hit_anim`,
                frameRate: 1,
                repeat: -1,
                frames: this.scene.anims.generateFrameNames(atlasKey, {
                    prefix: `${this.name}_hit_anim_f`,
                    start: 0,
                    end: 0,
                }),
            },
        };
        for (const [name, config] of Object.entries(animations)) {
            const animation = this.scene.anims.create(config);
            if (animation) {
                this.animations.push({ name, animation });
            } else {
                console.error(
                    `Animation creation failed with character ${this.name} and name ${name}!`
                );
            }
        }
    }
}
