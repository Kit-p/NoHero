import Phaser from 'phaser';

export default class Character extends Phaser.GameObjects.Sprite {
    /**
     * @returns {Types.InputControl[]}
     */
    static get DefaultControls() {
        return [
            {
                id: 'UP',
                name: 'Up',
                description: 'Move Up',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.W,
            },
            {
                id: 'DOWN',
                name: 'Down',
                description: 'Move Down',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.S,
            },
            {
                id: 'LEFT',
                name: 'Left',
                description: 'Move Left',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.A,
            },
            {
                id: 'RIGHT',
                name: 'Right',
                description: 'Move Right',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.D,
            },
            {
                id: 'FIRE',
                name: 'Fire',
                description: 'Fire a spell',
                type: 'MOUSE',
                mouseButton: 'PRIMARY',
            },
        ];
    }

    /** @type {boolean} Whether this character is currently controlled by human */
    isHumanControlled;

    /** @type {number} Pixels per second */
    _movementSpeed;

    /** @type {Object.<string, Types.InputControl>} Controls associated with this character. */
    _controls = {};

    /** @type {Phaser.Input.Keyboard.Key[]} For internal use only, handling conflicting key presses. */
    _keyPressSequence = [];

    /** @type {number} Cooldown for collision with a particular physics object (in milleseconds). */
    _physicsObjectCollisionCooldown = 3000;

    /** @type {Phaser.Types.Physics.Arcade.GameObjectWithBody[]} A list of collided physics object, will be removed upon reaching cooldown. */
    _collidedPhysicsObjects = [];

    /**
     * @param {Phaser.Scene} scene The Scene to which this character belongs.
     * @param {number} x The initial x-coordinate of the character.
     * @param {number} y The initial y-coordinate of the character.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this character will use to render with, as stored in the Texture Manager.
     * @param {string | number} [frame] An optional frame from the Texture this character is rendering with.
     * @param {Types.CharacterConfig} [config] An optional config object containing the specified properties.
     */
    constructor(
        scene,
        x,
        y,
        texture,
        frame,
        {
            name = '',
            isHumanControlled = false,
            movementSpeed = 64,
            controls = Character.DefaultControls,
            type = 'character',
        } = {}
    ) {
        super(scene, x, y, texture, frame);
        this.name = name;
        this.isHumanControlled = isHumanControlled;
        this._movementSpeed = movementSpeed;
        this.type = type;

        // add this character to the scene and the physics plugin
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        if (!(this.body instanceof Phaser.Physics.Arcade.Body)) {
            /** @type {Phaser.Physics.Arcade.Body} */
            this.body = new Phaser.Physics.Arcade.Body(
                this.scene.physics.world,
                this
            );
        }

        // add controls to the scene for taking keyboard input
        for (const control of controls) {
            this._controls[control.id] = control;
            if (control.type === 'KEYBOARD') {
                if (!control.key || control.key === null) {
                    console.error(`Missing key for control ${control.id}!`);
                    continue;
                }
                control.key = this.scene.input.keyboard.addKey(
                    control.key,
                    control.enableCapture === false ? false : true,
                    control.emitOnRepeat === true ? true : false
                );
            }
            this._controls[control.id].key = control.key;
        }

        // creating the animations
        this._createAnimations();
    }

    get movementSpeed() {
        return this._movementSpeed;
    }

    /**
     * @param {number} value The new movement speed.
     */
    set movementSpeed(value) {
        if (isNaN(value) || value < 0) {
            value = 0;
        } else if (value > 255) {
            value = 255;
        }
        this._movementSpeed = value;
    }

    get controls() {
        return this._controls;
    }

    get collidedPhysicsObjects() {
        return this._collidedPhysicsObjects;
    }

    /**
     * Must override this function to create the animations.
     */
    _createAnimations() {}

    /**
     * Handle basic movements only, must extend or override for finer controls including playing animation.
     */
    update() {
        if (this.isHumanControlled) {
            // handle conflicting key presses by memorizing the key press sequence
            for (const direction of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
                if (
                    this.controls[direction] &&
                    this.controls[direction].key instanceof
                        Phaser.Input.Keyboard.Key
                ) {
                    /** @type {Phaser.Input.Keyboard.Key} */
                    // @ts-ignore - Reason: type checked
                    const key = this.controls[direction].key;
                    const keyEqChk = (
                        /** @type {Phaser.Input.Keyboard.Key} */ k
                    ) => k.keyCode === key.keyCode;
                    let index = this._keyPressSequence.findIndex(keyEqChk);
                    if (key.isDown && index === -1) {
                        this._keyPressSequence.push(key);
                    } else if (key.isUp && index !== -1) {
                        // clean up ended key presses
                        do {
                            this._keyPressSequence.splice(index, 1);
                            index = this._keyPressSequence.findIndex(keyEqChk);
                        } while (index !== -1);
                    }
                }
            }

            // reset velocity
            this.body.setVelocity(0, 0);
            // determine movement direction
            for (const keyPress of this._keyPressSequence) {
                const direction = Object.keys(this.controls).find(
                    (direction) => {
                        if (
                            this.controls[direction].key instanceof
                            Phaser.Input.Keyboard.Key
                        ) {
                            /** @type {Phaser.Input.Keyboard.Key} */
                            // @ts-ignore - Reason: type checked
                            const key = this.controls[direction].key;
                            return key.keyCode === keyPress.keyCode;
                        } else {
                            return false;
                        }
                    }
                );
                if (direction !== undefined) {
                    switch (direction) {
                        case 'UP':
                            this.body.setVelocityY(-1);
                            break;
                        case 'DOWN':
                            this.body.setVelocityY(1);
                            break;
                        case 'LEFT':
                            this.body.setVelocityX(-1);
                            break;
                        case 'RIGHT':
                            this.body.setVelocityX(1);
                            break;
                    }
                }
            }
            // normalize and scale velocity for having uniform speed along all directions
            this.body.velocity.normalize().scale(this.movementSpeed);

            // update facing direction
            if (this.body.velocity.x > 0) {
                this.setFlipX(false);
            } else if (this.body.velocity.x < 0) {
                this.setFlipX(true);
            }
        }

        // * subclasses should extend to update animation if needed
    }

    /**
     * Remembers collision with other physics objects by adding them to the `_collidedPhysicsObjects` array.
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody} object The object collided with.
     */
    collidesWith(object) {
        // prevent adding duplicated objects within cooldown
        if (this.collidedPhysicsObjects.includes(object)) {
            return;
        }
        // add the collided object to the array
        this.collidedPhysicsObjects.push(object);
        // add a delayed callback to remove the collided object from the array after cooldown
        this.scene.time.delayedCall(
            this._physicsObjectCollisionCooldown,
            (
                /** @type {Phaser.Types.Physics.Arcade.GameObjectWithBody} */ object
            ) => {
                let index = this.collidedPhysicsObjects.indexOf(object);
                while (index !== -1) {
                    this.collidedPhysicsObjects.splice(index, 1);
                    index = this.collidedPhysicsObjects.indexOf(object);
                }
            },
            [object],
            this
        );
    }
}
