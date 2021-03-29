import Phaser from 'phaser';

export default class Character extends Phaser.GameObjects.Sprite {
    /**
     * @param {Phaser.Scene} scene The Scene to which this character belongs.
     * @param {number} x The initial x-coordinate of the character.
     * @param {number} y The initial y-coordinate of the character.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this character will use to render with, as stored in the Texture Manager.
     * @param {string | number} frame An optional frame from the Texture this character is rendering with.
     * @param {string} name The name of the character.
     * @param {string} type A textual representation of the type of sprite, i.e. character.
     */
    constructor(scene, x, y, texture, frame, name = '', type = 'character') {
        super(scene, x, y, texture, frame);
        this.name = name;
        this.type = type;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        if (!(this.body instanceof Phaser.Physics.Arcade.Body)) {
            /** @type {Phaser.Physics.Arcade.Body} */
            this.body = new Phaser.Physics.Arcade.Body(
                this.scene.physics.world,
                this
            );
        }
        this._createAnimations();
    }

    /**
     * @returns {Phaser.Physics.Arcade.Body} The dynamic arcade body of the character.
     */
    getBody() {
        return this.body;
    }

    /**
     * Must override this function to create the animations.
     */
    _createAnimations() {}
}
