import Phaser from 'phaser';

import { CharacterControlState } from '../classes/CharacterControlState';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import Utils from '../classes/Utils';

/**
 * @extends CharacterControlState
 */
export class StrongAIControlState extends CharacterControlState {
    /** @type {{x: number, y: number, weight: number}[]} */
    _pillars = [];

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

        // populate the colliding object arrays
        this._findCollidingObjects();
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

        // reset preference
        for (const pillar of this._pillars) {
            pillar.weight = 0;
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
     *
     */
    _findCollidingObjects() {
        // find all the pillars on the map
        const pillarLayer = this._character._scene.map.layers.find(
            (layer) => layer.name === 'Pillar'
        );
        if (pillarLayer === undefined) {
            return NaN;
        }
        const pillars = pillarLayer.filterTiles(
            () => true,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { isNotEmpty: true, isColliding: true }
        );

        for (const pillar of pillars) {
            this._pillars.push({
                x: pillar.getCenterX(),
                y: pillar.getCenterY(),
                weight: 0,
            });
        }
    }

    /**
     * Decide how to control the character with AI algorithm.
     * @protected
     */
    _decideControl() {
        let moveDirection;
        if (this._character.currentProjectile !== undefined) {
            // ranged character
            moveDirection = this._computeFleeAngle();
        } else {
            // melee character
            moveDirection = this._computeTrackAngle();
        }

        if (isNaN(moveDirection)) {
            // failed to determine moving direction
            return;
        }

        // find potion when health too low
        const critFactor = 0.5; // percentage
        if (this._character.health < this._character.maxHealth * critFactor) {
            const closestPotion = this._scene.physics.closest(
                this._character,
                this._character._scene.potionGroup
                    .getChildren()
                    .filter((potion) => potion.type === this._character.type)
            );

            if (closestPotion instanceof Phaser.Physics.Arcade.Body) {
                moveDirection = Utils.inclinationOf(
                    this._character,
                    closestPotion.center,
                    true
                );
            } else if (
                closestPotion instanceof Phaser.Physics.Arcade.StaticBody
            ) {
                // empty block for type checking
            } else if (
                closestPotion?.body instanceof Phaser.Physics.Arcade.Body
            ) {
                moveDirection = Utils.inclinationOf(
                    this._character,
                    closestPotion.body.center,
                    true
                );
            }
        }

        // decide how to track the player by avoiding projectile
        const collisionBounds = this._computeCollisionBounds();

        // adjust trackAngle to avoid collision with projectile
        for (const bound of collisionBounds) {
            // temporarily boost the angles for easy comparison
            if (bound.lower > bound.higher) {
                bound.higher += Math.PI * 2;
                moveDirection =
                    moveDirection < Math.PI
                        ? moveDirection + Math.PI * 2
                        : moveDirection;
            }

            if (moveDirection > bound.lower && moveDirection < bound.higher) {
                // trackAngle will run into projectile
                // adjust to closest angle without collision
                moveDirection =
                    Math.abs(moveDirection - bound.lower) <
                    Math.abs(moveDirection - bound.higher)
                        ? bound.lower
                        : bound.higher;
            }

            // normalize the angle to compensate the temporary boost
            moveDirection = Phaser.Math.Angle.Normalize(moveDirection);
        }

        // move the character in trackAngle
        const vec = new Phaser.Math.Vector2(
            Math.cos(moveDirection),
            Math.sin(moveDirection)
        )
            .normalize()
            .scale(this._character.movementSpeed);
        this._character.body.setVelocity(vec.x, vec.y);
    }

    /**
     * Compute the collision angle bounds that will run into projectile.
     * @protected
     * @returns {{lower: number, higher: number}[]} An array of collision angle bounds.
     */
    _computeCollisionBounds() {
        /** @type {{lower: number, higher: number}[]} An array of collision angle bounds. */
        const collisionBounds = [];
        const center = this._character.body.center;

        // calculate obstacle collision angle bounds

        // calculate projectile collision angle bounds
        const projectiles = this._character._scene.projectileGroup.getChildren();
        for (const projectile of projectiles) {
            if (
                projectile.type === this._character.type ||
                !(projectile.body instanceof Phaser.Physics.Arcade.Body)
            ) {
                continue;
            }

            const projectileCenter = projectile.body.center;

            const distance = Phaser.Math.Distance.BetweenPoints(
                center,
                projectileCenter
            );

            // ignore far away projectiles
            if (distance > 16 * 8) {
                continue;
            }

            const angle = Utils.inclinationOf(center, projectileCenter, true);

            // compute safe distance (minimum distance away from projectile to avoid collision)
            const safeDistance = this._computeSafeDistance(angle);

            const radius = projectile.body.radius;

            // set toleranceFactor to compensate Math inaccuracy
            const toleranceFactor = 4;
            const collisionAngle = Phaser.Math.Angle.Normalize(
                Math.atan2(radius * toleranceFactor + safeDistance, distance)
            );

            collisionBounds.push({
                lower: Phaser.Math.Angle.Normalize(angle - collisionAngle),
                higher: Phaser.Math.Angle.Normalize(angle + collisionAngle),
            });
        }

        return this._cleanUpCollisionBounds(collisionBounds);
    }

    /**
     * Compute safe distance (minimum distance away from projectile to avoid collision).
     * @protected
     * @param {number} projectileAngle The angle (in radian) of projectile relative to the character.
     * @returns {number} The safe distance.
     */
    _computeSafeDistance(projectileAngle) {
        const center = this._character.body.center;
        const safeAngle = projectileAngle - Math.PI / 2;
        const cosSafeAngle = Math.cos(safeAngle);
        const sinSafeAngle = Math.sin(safeAngle);
        let safeX, safeY;
        if (
            this._character.body.width * Math.abs(sinSafeAngle) <
            this._character.body.height * Math.abs(cosSafeAngle)
        ) {
            safeX = Math.sign(cosSafeAngle) * this._character.body.halfWidth;
            safeY = Math.tan(safeAngle) * safeX;
        } else {
            safeY = Math.sign(sinSafeAngle) * this._character.body.halfHeight;
            safeX = (1 / Math.tan(safeAngle)) * safeY;
        }
        return Math.hypot(center.x - safeX, center.y - safeY);
    }

    /**
     * Compute angle tracking a specific player.
     * @protected
     * @returns {number} The angle (NaN if no player to track).
     */
    _computeTrackAngle() {
        // decide which player to track
        const characters = this._character._scene.characterGroup.getChildren();
        /** @type {PlayerCharacter} */
        let playerToTrack;
        for (const character of characters) {
            if (
                !(character instanceof PlayerCharacter) ||
                character.type !== 'player'
            ) {
                continue;
            }

            // ignore dead player
            if (character.active === false || character.body === undefined) {
                continue;
            }

            // find the lowest health character to track
            if (
                playerToTrack === undefined ||
                playerToTrack.health < character.health
            ) {
                playerToTrack = character;
            }
            break;
        }

        // all player dead
        if (playerToTrack === undefined) {
            return NaN;
        }

        return Utils.inclinationOf(this._character, playerToTrack, true);
    }

    /**
     * Compute angle fleeing from the player.
     * @protected
     * @returns {number} The angle (NaN if no player to flee from).
     */
    _computeFleeAngle() {
        if (this._pillars.length <= 0) {
            // no pillar to hide (impossible as all maps should have pillar)
            return NaN;
        }

        const center = this._character.getCenter();

        // find the closest player to flee from and compute preference for pillars
        const characters = this._character._scene.characterGroup.getChildren();
        /** @type {PlayerCharacter} */
        let closestCharacter;
        /** @type {number} */
        let closestDistance;
        for (const character of characters) {
            if (!(character instanceof PlayerCharacter)) {
                continue;
            }
            if (character.type === this._character.type) {
                // ignore teamates
                continue;
            }
            const distance = Phaser.Math.Distance.BetweenPoints(
                center,
                character.getCenter()
            );

            // find closest character to flee from
            if (closestCharacter === undefined || distance < closestDistance) {
                closestCharacter = character;
                closestDistance = Phaser.Math.Distance.BetweenPoints(
                    center,
                    closestCharacter.getCenter()
                );
            }

            // compute preference (total distance of all player characters) for each pillars
            for (const pillar of this._pillars) {
                pillar.weight += Phaser.Math.Distance.BetweenPoints(
                    character.getCenter(),
                    { x: pillar.x, y: pillar.y }
                );
            }
        }

        // no player to flee from
        if (closestCharacter === undefined) {
            return NaN;
        }

        // TODO: use most preferred pillar to flee from closest player character
        return NaN;
    }

    /**
     * Merge overlapping collision angle bounds.
     * @protected
     * @param {{lower: number, higher: number}[]} collisionBounds The collision angle bounds to be cleaned up.
     * @returns {{lower: number, higher: number}[]} The cleaned up collision bounds.
     */
    _cleanUpCollisionBounds(collisionBounds) {
        for (let i = collisionBounds.length - 1; i >= 0; --i) {
            for (let j = collisionBounds.length - 1; j >= 0; --j) {
                if (i >= collisionBounds.length) {
                    i = collisionBounds.length - 1;
                }

                if (j >= collisionBounds.length) {
                    j = collisionBounds.length - 1;
                }

                if (i < 0 || j < 0) {
                    break;
                }

                if (i === j) {
                    continue;
                }

                // check transition from 2pi to 0
                const boundTransition = {
                    i: collisionBounds[i].higher < collisionBounds[i].lower,
                    j: collisionBounds[j].higher < collisionBounds[j].lower,
                };

                // use local copy to boost up the angle for easy comparison
                const boundI = {
                    lower: collisionBounds[i].lower,
                    higher: collisionBounds[i].higher,
                };
                const boundJ = {
                    lower: collisionBounds[j].lower,
                    higher: collisionBounds[j].higher,
                };

                if (boundTransition.i) {
                    boundI.higher += Math.PI * 2;
                    boundJ.higher += Math.PI * 2;
                    if (!boundTransition.j) {
                        boundJ.lower += Math.PI * 2;
                    }
                } else if (boundTransition.j) {
                    boundJ.higher += Math.PI * 2;
                    boundI.lower += Math.PI * 2;
                    boundI.higher += Math.PI * 2;
                }

                // check if bounds overlapping
                if (
                    boundI.higher >= boundJ.lower &&
                    boundJ.higher >= boundI.lower
                ) {
                    // merge overlapping bounds
                    collisionBounds[i].lower =
                        boundJ.lower < boundI.lower
                            ? collisionBounds[j].lower
                            : collisionBounds[i].lower;
                    collisionBounds[i].higher =
                        boundJ.higher > boundI.higher
                            ? collisionBounds[j].higher
                            : collisionBounds[i].higher;

                    collisionBounds.splice(j, 1);
                    // prevent invalid access and ensure complete checking
                    --i;
                }
            }
        }
        return collisionBounds;
    }
}
