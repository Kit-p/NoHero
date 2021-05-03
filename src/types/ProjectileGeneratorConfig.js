/**
 * @typedef {object} Types.ProjectileGeneratorConfig
 *
 * @property {number} [x] The x-coordinate of the projectile generator.
 * @property {number} [y] The y-coordinate of the projectile generator.
 * @property {{key: string, extra: Phaser.Types.Sound.SoundConfig | Phaser.Types.Sound.SoundMarker}} [audio] The audio to play when spawning a projectile.
 * @property {number} [scale] The scaling of the projectile.
 * @property {number} [speed] The speed of the projectile.
 * @property {number} [cooldown] The cooldown (in milleseconds) of the projectile.
 * @property {number} [damage] The damage of the projectile.
 * @property {number} [range] The range of the projectile (-1 for infinite).
 * @property {number} [capacity] The maximum number of the projectile instance at the same time (-1 for infinite).
 * @property {boolean} [isTrack] Flag indicating if the bullet will track enemies.
 * @property {boolean} [isTrap] Flag indicating if the bullet is a trap.
 * @property {{isPoison: boolean, isSlow: boolean}} [isField] Flag indicating if the projectile is a field instead of bullet.
 */
