import Phaser from 'phaser';

import { CharacterControlState } from '../classes/CharacterControlState';

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
        ];
    }

    /** @protected @type {Object.<string, Types.InputControl>} Controls associated with this character. */
    _controls = {};

    /** @protected @type {Phaser.Input.Keyboard.Key[]} For handling conflicting key presses. */
    _keyPressSequence = [];

    /**
     * @param {Character} character The character to control.
     * @param {Types.InputControl[]} [controls] An array of controls to be associated with this character.
     */
    constructor(character, controls = HumanControlState.DefaultControls) {
        super(character);
        // add controls to the scene for taking keyboard input
        for (const control of controls) {
            this._controls[control.id] = control;
            if (control.type === 'KEYBOARD') {
                if (!control.key || control.key === null) {
                    console.error(`Missing key for control ${control.id}!`);
                    continue;
                }
                control.key = this._character.scene.input.keyboard.addKey(
                    control.key,
                    control.enableCapture === false ? false : true,
                    control.emitOnRepeat === true ? true : false
                );
            }
            this._controls[control.id].key = control.key;
        }
    }

    /**
     * @override
     */
    update() {
        super.update();

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
        if (this._character.body.velocity.x > 0) {
            this._character.setFlipX(false);
        } else if (this._character.body.velocity.x < 0) {
            this._character.setFlipX(true);
        }
    }
}
