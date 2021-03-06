/**
 * @typedef {object} Types.PlayerCharacterConfig
 *
 * @property {string} [name] The name of the character.
 * @property {number} [movementSpeed] The default movement speed of this character in pixels per second.
 * @property {number} [maxHealth] The maximum health of the player.
 * @property {number} [health] The initial health of the player.
 * @property {number} [collideAttackDamage] The damage applied for collide attack.
 * @property {number} [projectileDamage] The damage applied for projectile attack.
 * @property {function(new:CharacterControlState, Character)} [controlState] The control state to be associated with the character.
 * @property {Object.<string, number>} [cooldowns] The cooldowns of various controls of this character.
 * @property {string} [type] A textual representation of the type of sprite, i.e. character.
 */
