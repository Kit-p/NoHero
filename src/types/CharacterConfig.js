/**
 * @typedef {import ('../classes/Character').default} Character
 * @typedef {import ('../classes/CharacterControlState').default} CharacterControlState
 */

/**
 * @typedef {object} Types.CharacterConfig
 *
 * @property {string} [name] The name of the character.
 * @property {number} [movementSpeed] The default movement speed of this character in pixels per second.
 * @property {function(new:CharacterControlState, Character)} [controlState] The control state to be associated with the character.
 * @property {string} [type] A textual representation of the type of sprite, i.e. character.
 */
