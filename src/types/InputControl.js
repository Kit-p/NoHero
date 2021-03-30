/**
 * @typedef {object} Types.InputControl
 *
 * @property {string} id For internal use, all uppercase letters, e.g. 'UP' or 'DOWN'.
 * @property {string} [name=''] The display name of the input control, e.g. 'Up' or 'Down'.
 * @property {string} [description=''] The description of the input control, e.g. 'Move Up', 'Move Down'.
 *
 * @property {('MOUSE'|'KEYBOARD')} type The input source type, must be one of the defined values.
 * @property {('LEFT'|'MIDDLE'|'RIGHT'|'PRIMARY'|'ANY')} [mouseButton='LEFT'] The mouse button effective for this control if type is 'MOUSE'.
 * @property {string | number | Phaser.Input.Keyboard.Key} [key] Either a Key object, a string, such as 'A' or 'SPACE', or a key code value.
 * @property {boolean} [enableCapture=true] Automatically call preventDefault on the native DOM browser event for the key codes being added.
 * @property {boolean} [emitOnRepeat=false] Controls if the Key will continuously emit a 'down' event while being held down (true), or emit the event just once (false, the default).
 */
