import Phaser from 'phaser';

import Utils from './Utils';
import { GameScene } from '../scenes/GameScene';
import { CharacterControlState } from './CharacterControlState';

/**
 * @extends Phaser.GameObjects.Sprite
 */
export class Character extends Phaser.GameObjects.Sprite {
    /** @type {GameScene} To enforce type checking. */
    _scene;

    /** @type {CharacterControlState} */
    controlState;

    /** @protected @type {number} Pixels per second */
    _maxMovementSpeed;

    /** @protected @type {number} Pixels per second */
    _movementSpeed;

    /** @protected @type {number} Cooldown for collision with a particular physics object (in milleseconds). */
    _physicsObjectCollisionCooldown = 3000;

    /** @protected @type {Phaser.Types.Physics.Arcade.GameObjectWithBody[]} A list of collided physics object, will be removed upon reaching cooldown. */
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
            movementSpeed = 64,
            controlState = undefined,
            type = 'character',
        } = {}
    ) {
        super(scene, x, y, texture, frame);
        if (!(this.scene instanceof GameScene)) {
            throw new Error('Character: must be owned by a GameScene!');
        } else {
            this._scene = this.scene;
        }
        this.name = name;
        this._maxMovementSpeed = movementSpeed;
        this._movementSpeed = movementSpeed;
        this.type = type;

        // add this character to the scene and the physics plugin
        this.scene.characterGroup.add(this, true);
        if (!(this.body instanceof Phaser.Physics.Arcade.Body)) {
            /** @type {Phaser.Physics.Arcade.Body} */
            this.body = new Phaser.Physics.Arcade.Body(
                this.scene.physics.world,
                this
            );
        }

        // prevent this character to be pushed
        this.body.pushable = false;

        if (typeof controlState === 'function') {
            this.controlState = new controlState(this);
            if (!(this.controlState instanceof CharacterControlState)) {
                throw new Error('Character: invalid control state!');
            }
        }

        // creating the animations
        this._createAnimations();
    }

    get maxMovementSpeed() {
        return this._maxMovementSpeed;
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

    get collidedPhysicsObjects() {
        return this._collidedPhysicsObjects;
    }

    /**
     * Must override this function to create the animations.
     * @protected
     */
    _createAnimations() {}

    /**
     * Override the destroy function to add fade out effect.
     * @param {number} [duration] The duration of fade out effect in milleseconds.
     */
    destroy(duration) {
        // if this character is not active, destroy immediately, otherwise show fade out effect
        if (this.active) {
            Utils.fadeOutDestroy(this, duration);
        } else {
            super.destroy();
        }
    }

    /**
     * Handle basic movements only, must extend or override for finer controls including playing animation.
     */
    update() {
        if (!(this.controlState instanceof CharacterControlState)) {
            return;
        }
        this.controlState.update();
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
