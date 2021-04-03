import Phaser from 'phaser';

import GameScene from './GameScene';
import PlayerCharacter from '../characters/PlayerCharacter';
import Utils from '../classes/Utils';

export default class GameUIScene extends Phaser.Scene {
    /** @type {{FULL: string, HALF: string, EMPTY: string}} The enum for predefined frame names of heart frames. */
    static _HeartFrames = {
        FULL: 'ui_heart_full',
        HALF: 'ui_heart_half',
        EMPTY: 'ui_heart_empty',
    };

    /** @type {Object.<string, number>} The enum for predefined color (in hex) for UI effects. */
    static _Colors = {
        TINT_HEAL: 0x6bea2a,
        TINT_HIT: 0xffffff,
    };

    /** @type {GameScene} The game scene this UI scene belongs to. */
    _gameScene;

    /** @type {Phaser.GameObjects.Group} The group for creating hearts. */
    _heartGroup;

    /** @type {PlayerCharacter} The player whose information to be displayed. */
    _displayPlayer;

    constructor() {
        super({ key: 'scene_game-ui' });
    }

    /**
     * @param {object} data The scene data object.
     * @param {GameScene} data.gameScene The game scene this UI scene belongs to.
     */
    init(data) {
        this._gameScene = data.gameScene;
        if (!(this._gameScene instanceof GameScene)) {
            console.error('GameUIScene: invalid property "gameScene"!');
            this.scene.stop();
        }
        this._heartGroup = this.add.group();
        this._displayPlayer = this._gameScene.currentHumanControlledCharacter;
        if (!(this._displayPlayer instanceof PlayerCharacter)) {
            console.error('GameUIScene: invalid player character to display!');
            this.scene.stop();
        }
    }

    preload() {
        this.load.atlas(
            'atlas_all-in-one-2',
            'assets/tiles/all-in-one/2.png',
            'assets/tiles/atlases/tile_all-in-one-2.json'
        );
    }

    create() {
        this._createHearts();
    }

    update() {
        this._displayPlayer = this._gameScene.currentHumanControlledCharacter;
        if (!(this._displayPlayer instanceof PlayerCharacter)) {
            console.error('GameUIScene: invalid player character to display!');
            this.scene.stop();
        }
        this._updateHearts();
    }

    _createHearts() {
        this._heartGroup.clear();
        this._heartGroup.createMultiple({
            classType: Phaser.GameObjects.Image,
            key: 'atlas_all-in-one-2',
            frame: GameUIScene._HeartFrames.FULL,
            quantity: Math.ceil(this._displayPlayer.maxHealth / 2),
            setXY: {
                x: 10,
                y: 10,
                stepX: 16,
            },
        });
    }

    _updateHearts() {
        const hearts = this._heartGroup.getChildren();
        const numHearts = hearts.length;
        if (numHearts !== Math.ceil(this._displayPlayer.maxHealth / 2)) {
            this._createHearts();
        }

        const currentPlayerHealth = this._displayPlayer.health;
        for (
            let health = 0, index = 0;
            index < numHearts;
            ++index, health += 2
        ) {
            const heart = hearts[index];
            if (!(heart instanceof Phaser.GameObjects.Image)) {
                continue;
            }
            if (health < currentPlayerHealth) {
                if (health + 1 < currentPlayerHealth) {
                    // flash green for 0.1s indicating received healing
                    if (heart.frame.name !== GameUIScene._HeartFrames.FULL) {
                        Utils.tintFill(
                            this,
                            heart,
                            100,
                            GameUIScene._Colors.TINT_HEAL
                        );
                    }
                    // draw a full heart
                    heart.setFrame(GameUIScene._HeartFrames.FULL);
                } else {
                    if (heart.frame.name === GameUIScene._HeartFrames.EMPTY) {
                        // flash green for 0.1s indicating received healing
                        Utils.tintFill(
                            this,
                            heart,
                            100,
                            GameUIScene._Colors.TINT_HEAL
                        );
                    } else if (
                        heart.frame.name === GameUIScene._HeartFrames.FULL
                    ) {
                        // flash white for 0.1s indicating received damage
                        Utils.tintFill(
                            this,
                            heart,
                            100,
                            GameUIScene._Colors.TINT_HIT
                        );
                    }
                    // draw a half heart
                    heart.setFrame('ui_heart_half');
                }
            } else {
                if (heart.frame.name !== GameUIScene._HeartFrames.EMPTY) {
                    // flash white for 0.1s indicating received damage
                    Utils.tintFill(
                        this,
                        heart,
                        100,
                        GameUIScene._Colors.TINT_HIT
                    );
                }
                // draw an empty heart
                heart.setFrame('ui_heart_empty');
            }
        }
    }
}
