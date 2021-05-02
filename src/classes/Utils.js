import Phaser from 'phaser';

export default class Utils {
    /**
     * Replacement method for `Phaser.GameObjects.GameObject.destroy()`.
     * Add a duration of fade out before destroying the object.
     * @static
     * @param {Phaser.GameObjects.GameObject} gameObject The game object to be destroyed.
     * @param {number} [duration] The duration of fade out in milleseconds.
     */
    static fadeOutDestroy(gameObject, duration = 500) {
        if (
            !(gameObject instanceof Phaser.GameObjects.GameObject) ||
            !(gameObject.scene instanceof Phaser.Scene)
        ) {
            return;
        }
        // disable game object during fade out effect
        gameObject.active = false;
        // play fade out effect and destroy the game object
        gameObject.scene.tweens.add({
            targets: gameObject,
            alpha: 0,
            delay: 0,
            duration: duration,
            ease: 'Linear',
            yoyo: false,
            repeat: 0,
            onComplete: () => {
                gameObject.destroy();
            },
        });
    }

    /**
     * Returns the mid point of two objects, relative to their center coordinates.
     * @static
     * @param {Phaser.GameObjects.Components.GetBounds} object1 The first object.
     * @param {Phaser.GameObjects.Components.GetBounds} object2 The second object.
     * @returns {Phaser.Math.Vector2} The Vector2 object containing the mid point coordinates.
     */
    static midPointOf(object1, object2) {
        const { x: x1, y: y1 } = object1.getCenter();
        const { x: x2, y: y2 } = object2.getCenter();
        return new Phaser.Math.Vector2(
            Math.floor((x1 + x2) / 2),
            Math.floor((y1 + y2) / 2)
        );
    }

    /**
     * Returns the inclination (in radian) of object2 from object1, relative to their center coordinates.
     * @static
     * @param {Phaser.GameObjects.Components.GetBounds | Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} object1 The first object.
     * @param {Phaser.GameObjects.Components.GetBounds | Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} object2 The second object.
     * @param {boolean} [toNormalize] Flag to indicate if the result should be normalized to [0, 2PI).
     * @returns {number} The inclination (in radian).
     */
    static inclinationOf(object1, object2, toNormalize = false) {
        // @ts-ignore - Reason: checked
        const { x: x1, y: y1 } = object1.getCenter?.() ?? object1;
        // @ts-ignore - Reason: checked
        const { x: x2, y: y2 } = object2.getCenter?.() ?? object2;
        const result = Math.atan2(y2 - y1, x2 - x1);
        return toNormalize ? Phaser.Math.Angle.Normalize(result) : result;
    }

    /**
     * Tint the object with the specified color for the specified duration.
     * @static
     * @param {Phaser.Scene} scene The scene the object belongs to.
     * @param {Phaser.GameObjects.Components.Tint} object The object to be tinted.
     * @param {number} duration The amount of time to be tinted for in milleseconds.
     * @param {number} color The color to be tinted with.
     */
    static tintFill(scene, object, duration, color) {
        object.setTintFill(color);
        if (duration > 0) {
            scene.time.delayedCall(duration, () => object.clearTint());
        }
    }

    /**
     * Create a sprite at the given coordinates, play the specified animation and destroy it.
     * @static
     * @param {Phaser.Scene} scene The scene to spawn the visual effect.
     * @param {number} x The x-coordinate of the visual effect.
     * @param {number} y The y-coordinate of the visual effect.
     * @param {string | Phaser.Textures.Texture} texture The texture for the sprite.
     * @param {Phaser.Types.Animations.Animation} animationConfig The animation configuration object.
     * @param {number} [rotation] The angle of the animation in radians with a right-hand clockwise system.
     */
    static spawnVisualEffect(scene, x, y, texture, animationConfig, rotation) {
        const sprite = scene.add.sprite(x, y, texture);
        sprite.setRotation(rotation);
        const animation = sprite.anims.create(animationConfig);
        if (!animation) {
            sprite.destroy();
            return;
        }
        sprite.play(animation, true);
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            sprite.destroy();
        });
    }

    /**
     * A utility method to create a text button with on-hover(-end) and on-click callback.
     * @static
     * @param {Phaser.Scene} scene The scene to create the button in.
     * @param {number} x The x-coordinate to create the button.
     * @param {number} y The y-coordinate to create the button.
     * @param {string} text The button text.
     * @param {Phaser.Types.GameObjects.Text.TextStyle} [style] The style of the button text.
     * @param {Phaser.Types.Input.InputConfiguration} [config] The button input configuration object.
     * @param {Types.PointerEventCallback} [onHover] The on-hover callback of the button.
     * @param {Types.PointerEventCallback} [onHoverEnd] The on-hover-end callback of the button.
     * @param {Types.PointerEventCallback} [onClick] The on-click callback of the button.
     * @returns {Phaser.GameObjects.Text} The text button created.
     */
    static createTextButton(
        scene,
        x,
        y,
        text,
        style,
        config,
        onHover,
        onHoverEnd,
        onClick
    ) {
        const button = scene.add.text(x, y, text, style);
        button.setInteractive(config);
        button.on('pointerover', onHover);
        button.on('pointerout', onHoverEnd);
        button.on('pointerdown', onClick);
        return button;
    }

    /**
     * A utility method to determine whether two objects are on the same level, horizontal or vertical or both.
     * @static
     * @param {Phaser.GameObjects.Components.ComputedSize & Phaser.GameObjects.Components.Transform} object1 The first object to compare.
     * @param {Phaser.GameObjects.Components.ComputedSize & Phaser.GameObjects.Components.Transform} object2 The second object to compare.
     * @param {boolean} horizontally Whether to compare horizontal level.
     * @param {boolean} vertically Whether to compare vertical level.
     * @returns {boolean} Wether the two objects on the same level, for the specified axis.
     */
    static onSameLevel(object1, object2, horizontally, vertically) {
        // set the flags by checking y/x coordinates overlapping
        const flags = {
            horizontal:
                object1.y + object1.displayHeight >= object2.y &&
                object2.y + object2.displayHeight >= object1.y,
            vertical:
                object1.x + object1.displayWidth >= object2.x &&
                object2.x + object2.displayWidth >= object1.x,
        };
        if (horizontally === true && vertically === true) {
            return flags.horizontal && flags.vertical;
        } else {
            return (
                (horizontally === true && flags.horizontal) ||
                (vertically === true && flags.vertical)
            );
        }
    }

    /**
     * A utility method to calculate the offset for centering all objects in the array on a specified axis.
     * @static
     * @param {Phaser.Math.Vector2 | Phaser.Types.Math.Vector2Like} center The center coordinates.
     * @param {(Phaser.GameObjects.Components.ComputedSize & Phaser.GameObjects.Components.Transform)[]} objects The objects for determing the offset from and for.
     * @param {boolean} horizontally Whether to calculate the offset on horizontal axis, if false then on vertical axis.
     * @returns {number} The offset.
     */
    static offsetToCenter(center, objects, horizontally) {
        const stats = {
            minX: Number.MAX_VALUE,
            maxX: Number.MIN_VALUE,
            width: -1,
            minY: Number.MAX_VALUE,
            maxY: Number.MIN_VALUE,
            height: -1,
        };
        // populate statistics about the objects
        for (const object of objects) {
            if (object.x < stats.minX) {
                stats.minX = object.x;
            }
            if (object.y < stats.minY) {
                stats.minY = object.y;
            }
            const objectMaxX = object.x + object.displayWidth;
            const objectMaxY = object.y + object.displayHeight;
            if (objectMaxX > stats.maxX) {
                stats.maxX = objectMaxX;
            }
            if (objectMaxY > stats.maxY) {
                stats.maxY = objectMaxY;
            }
        }
        stats.width = stats.maxX - stats.minX;
        stats.height = stats.maxY - stats.minY;
        // calculate offset to center
        if (horizontally === true) {
            const startX = center.x - stats.width / 2;
            return startX - stats.minX;
        } else {
            const startY = center.y - stats.height / 2;
            return startY - stats.minY;
        }
    }

    /**
     * A utility method to group game objects by their level on the specified axis.
     * @static
     * @param {(Phaser.GameObjects.Components.ComputedSize & Phaser.GameObjects.Components.Transform)[]} objects The array of objects to be grouped.
     * @param {boolean} horizontally Whether to calculate the offset on horizontal axis, if false then on vertical axis.
     * @returns {(Phaser.GameObjects.Components.ComputedSize & Phaser.GameObjects.Components.Transform)[][]} The groups.
     */
    static groupObjectsByLevel(objects, horizontally) {
        /** @type {(Phaser.GameObjects.Components.ComputedSize & Phaser.GameObjects.Components.Transform)[][]} Groups of objects on the same horizontal axis. */
        const groups = [];
        for (const object of objects) {
            // classify group of object by the specified level
            let classified = false;
            for (const group of groups) {
                for (const refObj of group) {
                    if (
                        Utils.onSameLevel(
                            refObj,
                            object,
                            horizontally,
                            !horizontally
                        )
                    ) {
                        group.push(object);
                        classified = true;
                        break;
                    }
                }
                if (classified) {
                    break;
                }
            }
            if (!classified) {
                groups.push([object]);
                classified = true;
            }
        }
        return groups;
    }

    /**
     * A utility method to center game objects in the scene.
     * @static
     * @param {Phaser.Scene} scene The scene the game objects belong to.
     * @param {(Phaser.GameObjects.Components.ComputedSize & Phaser.GameObjects.Components.Transform)[]} objects The game objects to be centered.
     * @param {boolean} horizontally Whether to center horizontally, i.e., on the x-axis.
     * @param {boolean} vertically Whether to center vertically, i.e., on the y-axis.
     * @param {boolean} [groupCentering] Whether to center in groups with relative coordinates.
     * @param {boolean} [verticallyFirst] Whether to center vertically first then horizontally, only have effect when `horizontally`, `vertically`, and `groupCentering` are all true.
     */
    static centerInScene(
        scene,
        objects,
        horizontally,
        vertically,
        groupCentering = true,
        verticallyFirst = false
    ) {
        const center = {
            x: scene.game.canvas.width / 2,
            y: scene.game.canvas.height / 2,
        };
        if (groupCentering === true) {
            const groupCenter = (/** @type {boolean} */ horizontally) => {
                for (const group of Utils.groupObjectsByLevel(
                    objects,
                    horizontally
                )) {
                    // center the group
                    const offset = Utils.offsetToCenter(
                        center,
                        group,
                        horizontally
                    );
                    for (const object of group) {
                        if (horizontally) {
                            object.setX(Math.round(object.x + offset));
                        } else {
                            object.setY(Math.round(object.y + offset));
                        }
                    }
                }
            };
            if (
                horizontally === true &&
                vertically === true &&
                verticallyFirst === true
            ) {
                groupCenter(false);
                groupCenter(true);
            } else {
                if (horizontally === true) {
                    groupCenter(true);
                }
                if (vertically === true) {
                    groupCenter(false);
                }
            }
        } else {
            for (const object of objects) {
                if (horizontally === true) {
                    object.setX(Math.round(center.x - object.displayWidth / 2));
                }
                if (vertically === true) {
                    object.setY(
                        Math.round(center.y - object.displayHeight / 2)
                    );
                }
            }
        }
    }

    /**
     * A utility method to determine if an angle is within a boundary.
     * @static
     * @param {number} angle The angle to be checked.
     * @param {number} lower The lower bound.
     * @param {number} upper The upper bound.
     */
    static isAngleBetween(angle, lower, upper) {
        angle = Phaser.Math.Angle.Normalize(angle);
        lower = Phaser.Math.Angle.Normalize(lower);
        upper = Phaser.Math.Angle.Normalize(upper);
        if (lower < upper) {
            // normal case
            return lower <= angle && angle <= upper;
        } else {
            // special case (transition from 2pi to 0)
            return lower <= angle || angle <= upper;
        }
    }

    /**
     * A utility method to update the facing direction of a game object with physics.
     * This method manipulates the flipX property of the object.
     * @static
     * @param {Phaser.Types.Physics.Arcade.GameObjectWithBody & Phaser.GameObjects.Components.Flip} object The object to handle.
     */
    static updateFacingDirection(object) {
        if (object.body.velocity.x > 0) {
            object.setFlipX(false);
        } else if (object.body.velocity.x < 0) {
            object.setFlipX(true);
        }
    }
}
