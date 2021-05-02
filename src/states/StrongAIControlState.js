import Phaser from 'phaser';

import { CharacterControlState } from '../classes/CharacterControlState';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import Utils from '../classes/Utils';

/**
 * @extends CharacterControlState
 */
export class StrongAIControlState extends CharacterControlState {
    /** @protected @type {{x: number, y: number, weight: number}[]} */
    _pillars = [];

    /** @protected @type {number} Max tween duration. */
    _maxTweenDuration;

    /** @protected @type {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} The previous character coordinates. */
    _characterPrev;

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

        // initialize previous coordinates
        this._characterPrev = this._character.body.position.clone();

        this._maxTweenDuration =
            (Math.hypot(16, 16) / this._character.movementSpeed) * 1000;

        if (this._character.name === 'wizard_m') {
            console.log(this._character);
        }
    }

    /**
     * @override
     */
    update() {
        super.update();

        if (this._pillars.length <= 0) {
            // populate the colliding object arrays
            for (const pillar of this._character._scene.pillars) {
                this._pillars.push({ x: pillar.x, y: pillar.y, weight: 0 });
            }
        }

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
        const angle = Utils.inclinationOf(
            this._characterPrev,
            this._character.body.position
        );
        this._character.setFlipX(Math.abs(angle) > Math.PI / 2);

        // update previous coordinates
        this._characterPrev = this._character.body.position.clone();

        // fire projectile if available
        this._handleFireProjectile();
    }

    /**
     * Decide how to control the character with AI algorithm.
     * @protected
     */
    _decideControl() {
        // heal with potion if possible and needed
        this._findPotion();

        if (this._character.currentProjectile !== undefined) {
            // ranged character
            this._flee();
            return;
        }

        // melee character
        let moveDirection = this._computeTrackAngle();

        if (isNaN(moveDirection)) {
            // failed to determine moving direction
            return;
        }

        // decide how to track the player by avoiding projectile
        const collisionBounds = this._computeCollisionBounds();

        // adjust trackAngle to avoid collision with projectile
        for (const bound of collisionBounds) {
            // temporarily boost the angles for easy comparison
            if (bound.lower > bound.upper) {
                bound.upper += Math.PI * 2;
                moveDirection =
                    moveDirection < Math.PI
                        ? moveDirection + Math.PI * 2
                        : moveDirection;
            }

            if (moveDirection > bound.lower && moveDirection < bound.upper) {
                // trackAngle will run into projectile
                // adjust to closest angle without collision
                moveDirection =
                    Math.abs(moveDirection - bound.lower) <
                    Math.abs(moveDirection - bound.upper)
                        ? bound.lower
                        : bound.upper;
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
     * @returns {{lower: number, upper: number}[]} An array of collision angle bounds.
     */
    _computeCollisionBounds() {
        /** @type {{lower: number, upper: number}[]} An array of collision angle bounds. */
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
                upper: Phaser.Math.Angle.Normalize(angle + collisionAngle),
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
                character.type === this._character.type
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
     * Flee from player, with path-finding and tween.
     * @protected
     */
    _flee() {
        if (this._pillars.length <= 0) {
            // no pillar to hide (impossible as all maps should have pillar)
            return;
        }

        // wait for existing tween to complete
        if (this._character._scene.tweens.isTweening(this._character)) {
            return;
        }

        const center = this._character.getCenter();

        // find the closest player to flee from and compute preference for pillars
        const characters = this._character._scene.characterGroup.getChildren();
        /** @type {PlayerCharacter} */
        let closestCharacter;
        /** @type {number} */
        let closestDistance;
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
            return;
        }

        // find the most preferred pillar
        let chosenPillar;
        for (const pillar of this._pillars) {
            if (
                chosenPillar === undefined ||
                pillar.weight > chosenPillar.weight
            ) {
                chosenPillar = pillar;
            }
        }

        if (chosenPillar === undefined) {
            return;
        }

        // determine the coordinates to move to
        let angle = Utils.inclinationOf(closestCharacter, {
            x: chosenPillar.x,
            y: chosenPillar.y,
        });
        const tolerance = Math.PI / 4;
        const bound = { lower: angle - tolerance, upper: angle + tolerance };
        angle = Math.random() * (bound.upper - bound.lower) + bound.lower;

        // calculate the tile coordinates of the path source and destination
        const source = {
            x: Math.floor(this._character.body.center.x / 16),
            y: Math.floor(this._character.body.center.y / 16),
        };
        const destination = {
            x: Math.floor((chosenPillar.x + Math.cos(angle) * 16) / 16),
            y: Math.floor((chosenPillar.y + Math.sin(angle) * 16) / 16),
        };

        // find the path
        this._character._scene.easystar.findPath(
            source.x,
            source.y,
            destination.x,
            destination.y,
            (path) => {
                if (path !== undefined && path !== null) {
                    // move the character to hide behind most preferred pillar
                    const tweens = [];
                    for (let i = 1; i < path.length; ++i) {
                        tweens.push({
                            x: path[i].x * 16 + 16 / 2,
                            y: path[i].y * 16 + 16 / 2,
                        });
                    }
                    this._character._scene.tweens.timeline({
                        targets: this._character,
                        duration: this._maxTweenDuration,
                        tweens,
                        onStart: () =>
                            this._character.anims.play(
                                {
                                    key: 'run',
                                    frameRate:
                                        (this._character.movementSpeed / 32) *
                                        4,
                                },
                                true
                            ),
                        onComplete: () =>
                            this._character.anims.play('idle', true),
                    });
                }
            }
        );
        this._character._scene.easystar.calculate();
    }

    /**
     * Find potion if health too low to heal.
     * @protected
     */
    _findPotion() {
        // find potion when health too low
        const critFactor = 0.5; // percentage

        // no need to heal if dead or health still high
        if (
            this._character.health <= 0 ||
            this._character.health > this._character.maxHealth * critFactor
        ) {
            return;
        }

        // wait for existing tweens to complete
        if (this._character._scene.tweens.isTweening(this._character)) {
            return;
        }

        // find the closest potion
        /** @type {Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | MatterJS.BodyType} */
        let closestPotion = this._scene.physics.closest(
            this._character,
            this._character._scene.potionGroup
                .getChildren()
                .filter((potion) => potion.type === this._character.type)
        );

        closestPotion =
            closestPotion instanceof Phaser.GameObjects.GameObject
                ? closestPotion.body
                : closestPotion;

        if (!(closestPotion instanceof Phaser.Physics.Arcade.Body)) {
            // no more potion
            return;
        }

        // calculate the tile coordinates for both the character and the potion
        const source = {
            x: Math.floor(this._character.body.center.x / 16),
            y: Math.floor(this._character.body.center.y / 16),
        };
        const destination = {
            x: Math.floor(closestPotion.center.x / 16),
            y: Math.floor(closestPotion.center.y / 16),
        };

        // find the path
        this._character._scene.easystar.findPath(
            source.x,
            source.y,
            destination.x,
            destination.y,
            (path) => {
                if (path !== undefined && path !== null) {
                    // move the character to pick up the potion
                    const tweens = [];
                    for (let i = 1; i < path.length; ++i) {
                        tweens.push({
                            x: path[i].x * 16 + 16 / 2,
                            y: path[i].y * 16 + 16 / 2,
                        });
                    }
                    this._character._scene.tweens.timeline({
                        targets: this._character,
                        duration: this._maxTweenDuration,
                        tweens,
                        onStart: () =>
                            this._character.anims.play(
                                {
                                    key: 'run',
                                    frameRate:
                                        (this._character.movementSpeed / 32) *
                                        4,
                                },
                                true
                            ),
                        onComplete: () =>
                            this._character.anims.play('idle', true),
                    });
                }
            }
        );
        this._character._scene.easystar.calculate();
    }

    /**
     * Merge overlapping collision angle bounds.
     * @protected
     * @param {{lower: number, upper: number}[]} collisionBounds The collision angle bounds to be cleaned up.
     * @returns {{lower: number, upper: number}[]} The cleaned up collision bounds.
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
                    i: collisionBounds[i].upper < collisionBounds[i].lower,
                    j: collisionBounds[j].upper < collisionBounds[j].lower,
                };

                // use local copy to boost up the angle for easy comparison
                const boundI = {
                    lower: collisionBounds[i].lower,
                    upper: collisionBounds[i].upper,
                };
                const boundJ = {
                    lower: collisionBounds[j].lower,
                    upper: collisionBounds[j].upper,
                };

                if (boundTransition.i) {
                    boundI.upper += Math.PI * 2;
                    boundJ.upper += Math.PI * 2;
                    if (!boundTransition.j) {
                        boundJ.lower += Math.PI * 2;
                    }
                } else if (boundTransition.j) {
                    boundJ.upper += Math.PI * 2;
                    boundI.lower += Math.PI * 2;
                    boundI.upper += Math.PI * 2;
                }

                // check if bounds overlapping
                if (
                    boundI.upper >= boundJ.lower &&
                    boundJ.upper >= boundI.lower
                ) {
                    // merge overlapping bounds
                    collisionBounds[i].lower =
                        boundJ.lower < boundI.lower
                            ? collisionBounds[j].lower
                            : collisionBounds[i].lower;
                    collisionBounds[i].upper =
                        boundJ.upper > boundI.upper
                            ? collisionBounds[j].upper
                            : collisionBounds[i].upper;

                    collisionBounds.splice(j, 1);
                    // prevent invalid access and ensure complete checking
                    --i;
                }
            }
        }
        return collisionBounds;
    }

    /**
     * Decide where to fire projectile if available.
     * @protected
     */
    _handleFireProjectile() {
        if (this._character.currentProjectile === undefined) {
            // no projectile to fire
            return;
        }

        const center = this._character.body.center;

        // shoot at the closest player
        const characters = this._character._scene.characterGroup.getChildren();
        /** @type {PlayerCharacter} */
        let closestCharacter;
        /** @type {number} */
        let closestDistance;
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

            // find closest character to flee from
            if (closestCharacter === undefined || distance < closestDistance) {
                closestCharacter = character;
                closestDistance = Phaser.Math.Distance.BetweenPoints(
                    center,
                    closestCharacter.getCenter()
                );
            }
        }

        if (closestCharacter === undefined) {
            // no player to shoot
            return;
        }

        // angle range (in radian)
        const inaccuracy = Math.PI / 4;
        const angle =
            Utils.inclinationOf(this._character, closestCharacter, true) +
            (Math.random() * (inaccuracy * 2) - inaccuracy);

        // compute a position simulating a mouse click
        const x =
            closestCharacter.body.center.x + Math.cos(angle) * closestDistance;
        const y =
            closestCharacter.body.center.y + Math.sin(angle) * closestDistance;

        // spawn the projectile
        this._character.currentProjectile.spawn(
            x,
            y,
            this._character.body.center.x,
            this._character.body.center.y
        );
    }
}
