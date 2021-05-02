import Phaser from 'phaser';

import Utils from '../classes/Utils';
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

        // handle firing projectile
        this._handleFireProjectile();

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

    /**
     * Handles firing projectile.
     * @protected
     */
    _handleFireProjectile() {
        if (this._character.currentProjectile === undefined) {
            // no projectile to fire
            return;
        }

        // find furthest enemy within range to shoot
        const center = this._character.body.center;
        const characters = this._scene.characterGroup.getChildren();
        /** @type {PlayerCharacter} */
        let furthestCharacter;
        /** @type {number} */
        let furthestDistance;
        for (const character of characters) {
            if (
                !(character instanceof PlayerCharacter) ||
                character.type === this._character.type
            ) {
                continue;
            }
            const distance = Phaser.Math.Distance.BetweenPoints(
                center,
                character.getCenter()
            );

            if (distance > this._character.currentProjectile.range) {
                continue;
            }

            // find furthest character
            if (
                furthestCharacter === undefined ||
                distance > furthestDistance
            ) {
                furthestCharacter = character;
                furthestDistance = distance;
            }
        }

        let angle, x, y;

        if (furthestCharacter === undefined) {
            // no player in range, pick random angle
            angle = Math.random() * Math.PI * 2;
            x = center.x + Math.cos(angle) * 16;
            y = center.y + Math.sin(angle) * 16;
        } else {
            // angle range (in radian)
            const inaccuracy = Math.PI / 8;
            angle =
                Utils.inclinationOf(this._character, furthestCharacter, true) +
                (Math.random() * (inaccuracy * 2) - inaccuracy);
            // compute a position simulating a mouse click
            x =
                furthestCharacter.body.center.x +
                Math.cos(angle) * furthestDistance;
            y =
                furthestCharacter.body.center.y +
                Math.sin(angle) * furthestDistance;
        }

        // spawn the projectile
        this._character.currentProjectile.spawn(
            x,
            y,
            this._character.body.center.x,
            this._character.body.center.y
        );
    }
}
