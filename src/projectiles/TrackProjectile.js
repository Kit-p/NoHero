import Phaser from 'phaser';

import { BasicProjectile } from './BasicProjectile';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import Utils from '../classes/Utils';

/**
 * @extends BasicProjectile
 */
export class TrackProjectile extends BasicProjectile {
    /** @protected @type {{x: number, y: number, distance: number, angle: number}[]} */
    _pillars = [];

    /** @protected @type {number} */
    _steeringThreshold = Math.PI / 240;

    /**
     * @param {Phaser.Scene} scene The Scene to which this projectile belongs.
     * @param {number} x The initial x-coordinate of this projectile.
     * @param {number} y The initial y-coordinate of this projectile.
     * @param {string | Phaser.Textures.Texture} texture The key, or instance of the Texture this projectile will use to render with, as stored in the Texture Manager.
     * @param {string | number} frame The initial frame from the Texture this projectile is rendering with.
     * @param {number} speed The speed of this projectile.
     * @param {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} velocity The velocity of this projectile.
     * @param {number} damage The damage of this projectile.
     * @param {number} range The range of this projectile (-1 for infinite).
     * @param {string} type The type of PlayerCharacter this projectile belongs to.
     * @param {number} [scale] The scaling of this projectile.
     */
    constructor(
        scene,
        x,
        y,
        texture,
        frame,
        speed,
        velocity,
        damage,
        range,
        type,
        scale = 1.0
    ) {
        super(
            scene,
            x,
            y,
            texture,
            frame,
            speed,
            velocity,
            damage,
            range,
            type,
            scale
        );

        // populate the pillars array
        for (const pillar of this._scene.pillars) {
            this._pillars.push({
                x: pillar.x,
                y: pillar.y,
                distance: 0,
                angle: 0,
            });
        }
    }

    update() {
        super.update();

        // compute angle to all pillars
        for (const pillar of this._pillars) {
            const pillarCoord = {
                x: pillar.x,
                y: pillar.y,
            };
            pillar.distance = Phaser.Math.Distance.BetweenPoints(
                this.body.center,
                pillarCoord
            );
            pillar.angle = Utils.inclinationOf(
                this.body.center,
                pillarCoord,
                true
            );
        }

        // select and track enemy
        let playerToShoot;
        const center = this.body.center;
        const characters = this._scene.characterGroup.getChildren();
        /** @type {{character: PlayerCharacter, distance: number}[]} */
        const reachableCharacters = [];
        /** @type {PlayerCharacter} */
        let closestCharacter;
        /** @type {number} */
        let closestDistance;
        for (const character of characters) {
            if (
                !(character instanceof PlayerCharacter) ||
                character.type === this.type
            ) {
                continue;
            }
            const distance = Phaser.Math.Distance.BetweenPoints(
                center,
                character.getCenter()
            );

            // find closest character
            if (closestCharacter === undefined || distance < closestDistance) {
                closestCharacter = character;
                closestDistance = Phaser.Math.Distance.BetweenPoints(
                    center,
                    closestCharacter.getCenter()
                );
            }

            // determine if character is reachable
            const angle = Utils.inclinationOf(
                this.body.center,
                character,
                true
            );
            let reachable = true;
            for (const pillar of this._pillars) {
                const threshold = Math.PI / Math.sqrt(distance);
                const collisionBound = {
                    lower: pillar.angle - threshold,
                    upper: pillar.angle + threshold,
                };
                if (
                    Utils.isAngleBetween(
                        angle,
                        collisionBound.lower,
                        collisionBound.upper
                    )
                ) {
                    reachable = false;
                }
            }
            if (reachable) {
                reachableCharacters.push({ character, distance });
            }
        }

        if (closestCharacter === undefined) {
            // no player to shoot
            return;
        }

        if (
            reachableCharacters.length <= 0 ||
            reachableCharacters.findIndex(
                (character) => character.character === closestCharacter
            ) >= 0
        ) {
            playerToShoot = closestCharacter;
        } else {
            closestCharacter = reachableCharacters[0].character;
            closestDistance = reachableCharacters[0].distance;
            for (const character of reachableCharacters) {
                if (character.distance < closestDistance) {
                    closestCharacter = character.character;
                    closestDistance = character.distance;
                }
            }
            playerToShoot = closestCharacter;
        }

        if (playerToShoot === undefined) {
            return;
        }

        // steer towards the tracking player
        const trackAngle = Utils.inclinationOf(this.body.center, playerToShoot);
        const normVelocity = new Phaser.Math.Vector2(this.velocity).normalize();
        let angle = Math.atan2(normVelocity.y, normVelocity.x);
        const difference = Math.abs(angle - trackAngle);
        let steering = this._steeringThreshold;
        if (difference > Math.PI) {
            const reflectedDifference = Math.PI * 2 - difference;
            if (reflectedDifference < this._steeringThreshold) {
                steering = reflectedDifference;
            }
        } else {
            if (difference < this._steeringThreshold) {
                steering = difference;
            }
        }
        if (difference > Math.PI) {
            angle = angle < trackAngle ? angle - steering : angle + steering;
        } else {
            angle = angle < trackAngle ? angle + steering : angle - steering;
        }
        normVelocity.setAngle(angle);
        this.velocity = normVelocity.normalize().scale(this._speed);
    }
}
