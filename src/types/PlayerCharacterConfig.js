/**
 * @typedef {object} Types.PlayerCharacterConfig
 *
 * @property {string} [name] The name of the character.
 * @property {boolean} [isHumanControlled] Whether this character is initially controlled by human.
 * @property {number} [movementSpeed] The default movement speed of this character in pixels per second.
 * @property {number} [maxHealth] The maximum health of the player.
 * @property {number} [health] The initial health of the player.
 * @property {number} [collideAttackDamage] The damage applied for collide attack.
 * @property {Types.InputControl[]} [controls] An array of controls to be associated with this character.
 * @property {string} [type] A textual representation of the type of sprite, i.e. character.
 */
