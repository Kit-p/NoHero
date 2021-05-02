import Phaser from 'phaser';

import Utils from '../classes/Utils';
import { CharacterControlState } from '../classes/CharacterControlState';
import { PlayerCharacter } from '../characters/PlayerCharacter';

/**
 * @extends CharacterControlState
 */
export class HumanControlState extends CharacterControlState {
    /**
     * @static
     * @returns {Types.InputControl[]}
     */
    static get DefaultControls() {
        return [
            {
                id: 'UP',
                name: 'Up',
                description: 'Move Up',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.W,
            },
            {
                id: 'DOWN',
                name: 'Down',
                description: 'Move Down',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.S,
            },
            {
                id: 'LEFT',
                name: 'Left',
                description: 'Move Left',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.A,
            },
            {
                id: 'RIGHT',
                name: 'Right',
                description: 'Move Right',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.D,
            },
            {
                id: 'FIRE',
                name: 'Fire',
                description: 'Fire a spell',
                type: 'MOUSE',
                mouseButton: 'PRIMARY',
            },
            {
                id: 'DASH',
                name: 'Dash',
                description: 'Dash forward',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.SPACE,
            },
            {
                id: 'SWITCH',
                name: 'Switch',
                description: 'Switch character',
                type: 'KEYBOARD',
                key: Phaser.Input.Keyboard.KeyCodes.Q,
            },
        ];
    }

    /** @protected @type {Object.<string, Types.InputControl>} Controls associated with this character. */
    _controls = {};

    /** @protected @type {Phaser.Input.Keyboard.Key[]} For handling conflicting key presses. */
    _keyPressSequence = [];

    /** @protected @type {number} The cooldown of dash control. */
    _dashCooldown;

    /** @protected @type {boolean} Flag to indicate whether dash is on cooldown. */
    _isDashOnCooldown = false;

    /** @protected @type {boolean} Flag to indicate whether the character is dashing. */
    _isDashing = false;

    /** @protected @type {boolean} Flag to indicate whether the character can fire a projectile. */
    _canFireProjectile = false;

    /**
     * @param {PlayerCharacter} character The character to control.
     * @param {Types.InputControl[]} [controls] An array of controls to be associated with this character.
     */
    constructor(
        character,
        controls = HumanControlState.DefaultControls,
        dashCooldown = 3000
    ) {
        super(character);

        if (!(this._character instanceof PlayerCharacter)) {
            throw new Error(
                'HumanControlState: can only control PlayerCharacter!'
            );
        }

        /** @type {PlayerCharacter} */
        this._character;

        // add controls to the scene for taking keyboard input
        for (const control of controls) {
            this._controls[control.id] = control;
            if (control.type === 'KEYBOARD') {
                if (!control.key || control.key === null) {
                    console.error(`Missing key for control ${control.id}!`);
                    continue;
                }
                control.key = this._scene.input.keyboard.addKey(
                    control.key,
                    control.enableCapture === false ? false : true,
                    control.emitOnRepeat === true ? true : false
                );
                this._controls[control.id].key = control.key;
            }
        }

        this._dashCooldown = dashCooldown;
    }

    /**
     * @override
     */
    update() {
        // ignore if not controlling
        if (
            this._character !==
            this._character._scene.currentHumanControlledCharacter
        ) {
            return;
        }

        super.update();

        // disable control when specified or the character is dashing
        if (!this._character._canMove || this._isDashing) {
            return;
        }

        // handle conflicting key presses by memorizing the key press sequence
        for (const direction of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
            if (
                this._controls[direction] &&
                this._controls[direction].key instanceof
                    Phaser.Input.Keyboard.Key
            ) {
                /** @type {Phaser.Input.Keyboard.Key} */
                // @ts-ignore - Reason: type checked
                const key = this._controls[direction].key;
                const keyEqChk = (/** @type {Phaser.Input.Keyboard.Key} */ k) =>
                    k.keyCode === key.keyCode;
                let index = this._keyPressSequence.findIndex(keyEqChk);
                if (key.isDown && index === -1) {
                    this._keyPressSequence.push(key);
                } else if (key.isUp && index !== -1) {
                    // clean up ended key presses
                    do {
                        this._keyPressSequence.splice(index, 1);
                        index = this._keyPressSequence.findIndex(keyEqChk);
                    } while (index !== -1);
                }
            }
        }

        // reset velocity
        this._character.body.setVelocity(0, 0);
        // determine movement direction
        for (const keyPress of this._keyPressSequence) {
            const direction = Object.keys(this._controls).find((direction) => {
                if (
                    this._controls[direction].key instanceof
                    Phaser.Input.Keyboard.Key
                ) {
                    /** @type {Phaser.Input.Keyboard.Key} */
                    // @ts-ignore - Reason: type checked
                    const key = this._controls[direction].key;
                    return key.keyCode === keyPress.keyCode;
                } else {
                    return false;
                }
            });
            if (direction !== undefined) {
                switch (direction) {
                    case 'UP':
                        this._character.body.setVelocityY(-1);
                        break;
                    case 'DOWN':
                        this._character.body.setVelocityY(1);
                        break;
                    case 'LEFT':
                        this._character.body.setVelocityX(-1);
                        break;
                    case 'RIGHT':
                        this._character.body.setVelocityX(1);
                        break;
                }
            }
        }
        // normalize and scale velocity for having uniform speed along all directions
        this._character.body.velocity
            .normalize()
            .scale(this._character.movementSpeed);

        // update facing direction
        Utils.updateFacingDirection(this._character);

        this._handleDash();

        // always check if the character has a selected projectile
        if (this._character.currentProjectile === undefined) {
            this._canFireProjectile = false;
        } else if (!this._canFireProjectile) {
            // enable firing projectile when mouse click releases (from clicking the play button)
            this._scene.input.once('pointerup', () => {
                this._canFireProjectile = true;
            });
        }

        this._handleFireProjectile();

        // handle switch character
        this._handleSwitch();
    }

    /**
     * A handler for switching character.
     * @protected
     */
    _handleSwitch() {
        const switchControl = this._controls['SWITCH'];
        if (switchControl === undefined || switchControl === null) {
            return;
        }
        if (!(switchControl.key instanceof Phaser.Input.Keyboard.Key)) {
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(switchControl.key)) {
            // switch the character
            this._character._scene.switchCharacter();
        }
    }

    /**
     * A handler for dashing.
     * @protected
     */
    _handleDash() {
        // ignore if on cooldown
        if (this._isDashOnCooldown) {
            return;
        }

        const dashControl = this._controls['DASH'];
        if (dashControl === undefined || dashControl === null) {
            return;
        }
        if (dashControl.type === 'KEYBOARD') {
            // guard statement
            if (!(dashControl.key instanceof Phaser.Input.Keyboard.Key)) {
                return;
            }

            if (dashControl.key.isDown) {
                // dash
                const dashDuration = 300;
                const dashSpeed = 150;
                const originalVelocity = this._character.body.velocity.clone();

                // initialize direction as facing direction
                let direction = new Phaser.Math.Vector2({
                    x: this._character.flipX ? -1 : 1,
                    y: 0,
                });

                // change direction to moving direction if not idle
                if (
                    this._character.body.velocity.x !== 0 ||
                    this._character.body.velocity.y !== 0
                ) {
                    direction = this._character.body.velocity.clone();
                }

                direction.normalize();

                // make the player move forward is high speed for a short duration to simulate a dash
                this._character.body.velocity = direction.scale(dashSpeed);
                this._isDashing = true;
                this._isDashOnCooldown = true;

                // restore original velocity after dash ends
                this._scene.time.delayedCall(dashDuration, () => {
                    this._character.body?.setVelocity(
                        originalVelocity.x,
                        originalVelocity.y
                    );
                    this._isDashing = false;
                });

                // re-activate dash after cooldown
                this._scene.time.delayedCall(this._dashCooldown, () => {
                    this._isDashOnCooldown = false;
                });
            }
        }
    }

    /**
     * A handler for firing projectile.
     * @protected
     */
    _handleFireProjectile() {
        // ignore if the character cannot fire projectile
        if (!this._canFireProjectile) {
            return;
        }

        const fireControl = this._controls['FIRE'];
        let toFire = false;
        if (fireControl === undefined || fireControl === null) {
            return;
        }
        if (fireControl.type === 'MOUSE') {
            // check if mouse button is held down
            switch (fireControl.mouseButton) {
                case 'PRIMARY':
                    toFire = this._scene.input.mousePointer.primaryDown;
                    break;
                case 'LEFT':
                    toFire = this._scene.input.mousePointer.leftButtonDown();
                    break;
                case 'MIDDLE':
                    toFire = this._scene.input.mousePointer.middleButtonDown();
                    break;
                case 'RIGHT':
                    toFire = this._scene.input.mousePointer.rightButtonDown();
                    break;
                case 'ANY':
                default:
                    toFire = !this._scene.input.mousePointer.noButtonDown();
            }
        } else {
            // check if key is held down
            const key = fireControl.key;
            if (!(key instanceof Phaser.Input.Keyboard.Key)) {
                return;
            } else {
                toFire = key.isDown;
            }
        }

        if (toFire) {
            // spawn the projectile flying towards the mouse pointer location
            this._character.currentProjectile.spawn(
                this._scene.input.mousePointer.x,
                this._scene.input.mousePointer.y
            );
        }
    }
}
