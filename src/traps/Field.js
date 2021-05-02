import Phaser from 'phaser';
import Utils from '../classes/Utils';

import { GameScene } from '../scenes/GameScene';

/**
 * @extends Phaser.GameObjects.Graphics
 */
export class Field extends Phaser.GameObjects.Graphics {
    /** @type {GameScene} To enforce type checking. */
    _scene;

    /** @type {number} The color of this field. */
    _color;

    /** @type {number} The damage of this field. */
    _damage;

    /** @type {{isPoison: boolean, isSlow: boolean}} The effect of this field. */
    _effects;

    /** @protected @type {number} Cooldown for collision with a particular player character (in milleseconds). */
    _collisionCooldown = 3000;

    /** @protected @type {PlayerCharacter[]} A list of collided player character, will be removed upon reaching cooldown. */
    _collidedPlayerCharacters = [];

    /**
     * @param {Phaser.Scene} scene The Scene to which this field belongs.
     * @param {number} x The x-coordinate of the center of this field.
     * @param {number} y The y-coordinate of the center of this field.
     * @param {string} type The type of PlayerCharacter this field belongs to.
     * @param {number} capacity The maximum number of this field instance (-1 for infinite).
     * @param {number} radius The radius of the center of this field.
     * @param {number} damage The damage of the center of this field.
     * @param {{isPoison: boolean, isSlow: boolean}} effects The effect of this field.
     * @param {number} color The color of the center of this field.
     * @param {number} [duration] The duration (in milleseconds) of this field (-1 for infinite).
     * @param {number} [alpha] The alpha of the center of this field.
     */
    constructor(
        scene,
        x,
        y,
        type,
        capacity,
        radius,
        damage,
        effects,
        color,
        duration = -1,
        alpha = 0.5
    ) {
        super(scene);

        if (!(this.scene instanceof GameScene)) {
            throw new Error('Field: must be owned by a GameScene!');
        } else {
            this._scene = this.scene;
        }

        this.type = type;
        this._color = color;
        this._damage = damage;
        this._effects = effects;

        if (capacity >= 0) {
            // remove existing fields if exceeded capacity
            const fields = this._scene.fieldGroup
                .getChildren()
                .filter((field) => {
                    if (!(field instanceof Field)) {
                        return false;
                    }
                    return (
                        field._effects.isPoison === this._effects.isPoison &&
                        field._effects.isSlow === this._effects.isSlow
                    );
                });

            for (let i = 0; i <= fields.length - capacity; ++i) {
                const field = fields[i];
                if (!(field.body instanceof Phaser.Physics.Arcade.Body)) {
                    continue;
                }
                field.body?.setEnable(false);
                Utils.fadeOutDestroy(fields[i], 250);
            }
        }

        // ensure this field is on top of everything
        this.setDepth(
            this._scene.map.layers[this._scene.map.layers.length - 1].depth +
                100
        );

        this.fillStyle(color, alpha);
        this.fillCircle(x, y, radius);

        // add this field to the scene and the physics plugin
        this._scene.fieldGroup.add(this, true);
        if (!(this.body instanceof Phaser.Physics.Arcade.Body)) {
            /** @type {Phaser.Physics.Arcade.Body} */
            this.body = new Phaser.Physics.Arcade.Body(
                this.scene.physics.world,
                this
            );
        }

        this.body.setCircle(radius, x - radius, y - radius);

        if (duration >= 0) {
            // destroy field if exceeded duration
            this._scene.time.delayedCall(duration, () => {
                if (this !== undefined) {
                    this.body?.setEnable(false);
                    Utils.fadeOutDestroy(this, 250);
                }
            });
        }
    }

    get collidedPlayerCharacters() {
        return this._collidedPlayerCharacters;
    }

    /**
     * Remembers collision with player characters by adding them to the `_collidedPlayerCharacters` array.
     * @param {PlayerCharacter} character The player character collided with.
     */
    collidesWith(character) {
        // prevent adding characters of the same team or duplicated characters within cooldown
        if (
            character.type === this.type ||
            this.collidedPlayerCharacters.includes(character)
        ) {
            return;
        }

        // add the collided character to the array
        this.collidedPlayerCharacters.push(character);

        // apply effect on the collided character
        this._applyEffects(character);

        // add a delayed callback to remove the collided character from the array after cooldown
        this.scene.time.delayedCall(
            this._collisionCooldown,
            (/** @type {PlayerCharacter} */ character) => {
                let index = this.collidedPlayerCharacters.indexOf(character);
                while (index !== -1) {
                    this.collidedPlayerCharacters.splice(index, 1);
                    index = this.collidedPlayerCharacters.indexOf(character);
                }
            },
            [character],
            this
        );
    }

    /**
     * Handler to apply effect of this field to the collided player character.
     * @protected
     * @param {PlayerCharacter} character The player character collided with.
     */
    _applyEffects(character) {
        if (this._effects?.isSlow) {
            // tint the character
            Utils.tint(
                this._scene,
                character,
                this._collisionCooldown,
                this._color
            );
            // slow the character by half for specific duration
            const originalSpeed = character.movementSpeed;
            character.movementSpeed *= 0.5;
            // reset the speed after duration
            this._scene.time.delayedCall(this._collisionCooldown, () => {
                if (character !== undefined) {
                    character.movementSpeed = originalSpeed;
                }
            });
        }
        if (this._effects?.isPoison) {
            // tint the character
            Utils.tint(
                this._scene,
                character,
                this._collisionCooldown,
                this._color
            );
            // poison the character with multiple tick damage for specific duration
            for (
                let delay = 1000;
                delay <= this._collisionCooldown;
                delay += 1000
            ) {
                this._scene.time.delayedCall(delay, () => {
                    character?.takeHit(this._damage, this, false);
                });
            }
        }
    }
}
