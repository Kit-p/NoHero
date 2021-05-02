import Utils from './Utils';
import { Character } from './Character';
import { GameScene } from '../scenes/GameScene';

export class CharacterControlState {
    /** @protected @type {GameScene} The scene the character belongs to. */
    _scene;

    /** @protected @type {Character} The character to control. */
    _character;

    /**
     * @param {Character} character The character to control.
     */
    constructor(character) {
        if (!(character instanceof Character)) {
            throw new Error(
                'CharacterControlState: can only control Character!'
            );
        }
        if (!(character.scene instanceof GameScene)) {
            throw new Error(
                'CharacterControlState: can only control Character belonging to GameScene!'
            );
        }
        this._character = character;
        this._scene = character.scene;
    }

    /**
     * Must be overridden to provide control to the character.
     */
    update() {
        Utils.updateFacingDirection(this._character);
    }
}
