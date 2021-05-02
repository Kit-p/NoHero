import Phaser from 'phaser';

import { GameScene } from '../scenes/GameScene';

/**
 * @extends Phaser.GameObjects.Sprite
 */
export class Potion extends Phaser.GameObjects.Sprite {
    /** @type {GameScene} To enforce type checking. */
    _scene;

    /** @protected @type {number} The amount of healing (uses same ratio as damage) */
    _healing;

    /**
     * @param {Phaser.Scene} scene The Scene to which this potion belongs.
     * @param {number} x The initial x-coordinate of this potion.
     * @param {number} y The initial y-coordinate of this potion.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this potion will use to render with, as stored in the Texture Manager.
     * @param {string | number} frame The initial frame from the Texture this potion is rendering with.
     * @param {string} type The type of PlayerCharacter this potion applies to.
     */
    constructor(scene, x, y, texture, frame, type, healing = 2) {
        super(scene, x, y, texture, frame);
        this.type = type;
        this._healing = healing;

        if (!(this.scene instanceof GameScene)) {
            throw new Error('Potion: must be owned by a GameScene!');
        } else {
            this._scene = this.scene;
        }

        // add this potion to the scene and the physics plugin
        this._scene.potionGroup.add(this, true);
        if (!(this.body instanceof Phaser.Physics.Arcade.Body)) {
            /** @type {Phaser.Physics.Arcade.Body} */
            this.body = new Phaser.Physics.Arcade.Body(
                this.scene.physics.world,
                this
            );
        }

        // adjust hitbox
        this.body.setSize(this.width * 0.6, this.height * 0.6);
    }

    /**
     * @returns The amount of healing this potion does.
     */
    get healing() {
        return this._healing;
    }
}
