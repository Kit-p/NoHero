import Phaser from 'phaser';

import { CharacterControlState } from '../classes/CharacterControlState';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import Utils from '../classes/Utils';

/**
 * @extends CharacterControlState
 */
export class StrongAIControlState extends CharacterControlState {
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

        // disable control when hit animation is still playing
        if (
            this._character.anims.currentAnim !== null &&
            this._character.anims.currentAnim.key === 'hit'
        ) {
            return;
        }

        this._decideControl();

        // normalize and scale velocity for having uniform speed along all directions
        this._character.body.velocity
            .normalize()
            .scale(this._character.movementSpeed);

        // update facing direction
        if (this._character.body.velocity.x > 0) {
            this._character.setFlipX(false);
        } else if (this._character.body.velocity.x < 0) {
            this._character.setFlipX(true);
        }
    }

    /**
     * Decide how to control the character with AI algorithm.
     * @protected
     */
    _decideControl() {
        const characters = this._character._scene.physicsGroup.getChildren();
        let playerToTrack;
        for (const character of characters) {
            if (
                !(character instanceof PlayerCharacter) ||
                character.type !== 'player'
            ) {
                continue;
            }
            playerToTrack = character;
            break;
        }
        const inclination = Utils.inclinationOf(this._character, playerToTrack);
        const vec = new Phaser.Math.Vector2(
            Math.cos(inclination),
            Math.sin(inclination)
        )
            .normalize()
            .scale(this._character.movementSpeed);
        this._character.body.setVelocity(vec.x, vec.y);
    }
}
