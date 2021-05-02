import Phaser from 'phaser';

import { CharacterControlState } from '../classes/CharacterControlState';
import { PlayerCharacter } from '../characters/PlayerCharacter';

/**
 * @extends CharacterControlState
 */
export class WeakAIControlState extends CharacterControlState {
    /** @type {boolean} Flag indicating if the character should change direction. */
    _shouldChangeDirection = true;

    /** @type {number} The time interval of changing direction. */
    _interval = 2000;

    /**
     * @param {PlayerCharacter} character The character to control.
     */
    constructor(character) {
        super(character);

        if (!(this._character instanceof PlayerCharacter)) {
            throw new Error(
                'StrongAIControlState: can only control PlayerCharacter!'
            );
        }

        /** @type {PlayerCharacter} */
        this._character;
    }

    /**
     * @override
     */
    update() {
        super.update();

        // TODO: handle firing projectile

        if (!this._shouldChangeDirection) {
            return;
        }

        // lock direction for interval
        this._shouldChangeDirection = false;
        this._character?._scene?.time?.delayedCall(
            this._interval,
            () => (this._shouldChangeDirection = true)
        );

        // change to a random direction
        const angle = Math.random() * Math.PI * 2;
        const vec = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle))
            .normalize()
            .scale(this._character.movementSpeed);
        this._character.body.setVelocity(vec.x, vec.y);
    }
}
