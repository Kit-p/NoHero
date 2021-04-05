import { Character } from './Character';

export class CharacterControlState {
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
        this._character = character;
    }

    /**
     * Must be overridden to provide control to the character.
     */
    update() {}
}
