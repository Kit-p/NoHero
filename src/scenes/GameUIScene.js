import Phaser from 'phaser';

import Constants from '../classes/Constants';
import Utils from '../classes/Utils';
import { GameScene } from './GameScene';
import { PlayerCharacter } from '../characters/PlayerCharacter';

export class GameUIScene extends Phaser.Scene {
    /** @static @protected @type {{FULL: string, HALF: string, EMPTY: string}} The enum for predefined frame names of heart frames. */
    static _HeartFrames = {
        FULL: 'ui_heart_full',
        HALF: 'ui_heart_half',
        EMPTY: 'ui_heart_empty',
    };

    /** @protected @type {GameScene} The game scene this UI scene belongs to. */
    _gameScene;

    /** @protected @type {Phaser.GameObjects.Group} The group for creating hearts. */
    _heartGroup;

    /** @protected @type {PlayerCharacter} The player whose information to be displayed. */
    _displayPlayer;

    constructor() {
        super({ key: Constants.SCENE.GAME_UI });
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
            return;
        }
        this._heartGroup = this.add.group();
        this._displayPlayer = this._gameScene.currentHumanControlledCharacter;
        if (!(this._displayPlayer instanceof PlayerCharacter)) {
            console.error('GameUIScene: invalid player character to display!');
            this.scene.stop();
            return;
        }
    }

    create() {
        this._createHearts();
    }

    update() {
        this._displayPlayer = this._gameScene.currentHumanControlledCharacter;
        if (!(this._displayPlayer instanceof PlayerCharacter)) {
            console.error('GameUIScene: invalid player character to display!');
            this.scene.stop();
            return;
        }
        this._updateHearts();
    }

    /**
     * Create the hearts displaying on the UI.
     * @protected
     */
    _createHearts() {
        this._heartGroup.clear(true, true);
        this._heartGroup.createMultiple({
            classType: Phaser.GameObjects.Image,
            key: Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            frame: GameUIScene._HeartFrames.FULL,
            quantity: Math.ceil(this._displayPlayer.maxHealth / 2),
            setXY: {
                x: 10,
                y: 10,
                stepX: 16,
            },
        });
    }

    /**
     * Update the hearts to display correct frames.
     * @protected
     */
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
                        Utils.tintFill(this, heart, 100, Constants.COLOR.HEAL);
                    }
                    // draw a full heart
                    heart.setFrame(GameUIScene._HeartFrames.FULL);
                } else {
                    if (heart.frame.name === GameUIScene._HeartFrames.EMPTY) {
                        // flash green for 0.1s indicating received healing
                        Utils.tintFill(this, heart, 100, Constants.COLOR.HIT);
                    } else if (
                        heart.frame.name === GameUIScene._HeartFrames.FULL
                    ) {
                        // flash white for 0.1s indicating received damage
                        Utils.tintFill(this, heart, 100, Constants.COLOR.HIT);
                    }
                    // draw a half heart
                    heart.setFrame(GameUIScene._HeartFrames.HALF);
                }
            } else {
                if (heart.frame.name !== GameUIScene._HeartFrames.EMPTY) {
                    // flash white for 0.1s indicating received damage
                    Utils.tintFill(this, heart, 100, Constants.COLOR.HIT);
                }
                // draw an empty heart
                heart.setFrame(GameUIScene._HeartFrames.EMPTY);
            }
        }
    }
}
