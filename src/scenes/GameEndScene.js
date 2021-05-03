import Phaser from 'phaser';

import Constants from '../classes/Constants';
import Utils from '../classes/Utils';

export class GameEndScene extends Phaser.Scene {
    /** @protected @type {boolean} Whether the player has victory. */
    _isVictory;

    /** @protected @type {string | Phaser.Scene} The scene of the current level. */
    _currentScene;

    /** @protected @type {string | Phaser.Scene} The scene to the next level, TitleScene if is last level. */
    _nextScene;

    constructor() {
        super({ key: Constants.SCENE.GAME_END });
    }

    preload() {
        for (const value of Object.values(Constants.RESOURCE.AUDIO)) {
            this.sound.add(value);
        }
    }

    /**
     * @param {object} data The scene data object.
     * @param {boolean} data.isVictory Wether the player has victory.
     * @param {string | Phaser.Scene} data.currentScene The scene of the current level.
     * @param {string | Phaser.Scene} [data.nextScene] The scene to the next level.
     */
    init(data) {
        this._isVictory = data.isVictory === true ? true : false;
        this._currentScene = data.currentScene;
        this._nextScene = data.nextScene;
        this.scale.setGameSize(800, 600);

        const key = this._isVictory
            ? Constants.RESOURCE.AUDIO.WIN
            : Constants.RESOURCE.AUDIO.LOSE;
        this.sound.play(key, { volume: 0.3 });
    }

    create() {
        // set background image
        let background, scale;
        if (this._isVictory) {
            background = Constants.RESOURCE.IMAGE.TREASURE;
            scale = 2;
        } else {
            background = Constants.RESOURCE.IMAGE.SKULL;
            scale = 4;
        }
        this.add
            .image(
                this.game.canvas.width / 2,
                this.game.canvas.height / 2,
                background
            )
            .setOrigin(0.5)
            .setScale(scale)
            .setAlpha(0.25);

        // create victory screen or lost screen
        const strings = {
            win: {
                title: 'NO HERO!',
                description: 'aka YOU WIN!',
            },
            lose: {
                title: 'NO!\nHERO!',
                description: 'aka YOU LOSE!',
            },
        };

        const objects = [];

        // create the title with corresponding text
        const title = this.add.text(
            0,
            0,
            this._isVictory ? strings.win.title : strings.lose.title,
            {
                fontSize: '96px',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                align: 'center',
                color: this._isVictory ? '#00ff00' : '#ff0000',
            }
        );

        objects.push(title);

        // create the (funny?) description with corresponding text
        const description = this.add.text(
            0,
            title.y + title.displayHeight + 50,
            this._isVictory
                ? strings.win.description
                : strings.lose.description,
            {
                fontSize: '24px',
                fontStyle: 'normal',
                fontFamily: 'Arial',
                align: 'center',
                color: this._isVictory ? '#00ff00' : '#ff0000',
            }
        );

        objects.push(description);

        // create the next level button
        if (this._isVictory) {
            if (this._nextScene === undefined) {
                // create thank you text
                const thankyou = this.add.text(
                    0,
                    description.y + description.displayHeight + 50,
                    'This is all for the demo! Thank you!',
                    {
                        fontSize: '36px',
                        fontStyle: 'normal',
                        fontFamily: 'Arial',
                        align: 'center',
                        color: this._isVictory ? '#00ff00' : '#ff0000',
                    }
                );
                objects.push(thankyou);
            } else {
                const nextLevelButton = Utils.createTextButton(
                    this,
                    0,
                    description.y + description.displayHeight + 50,
                    'Next Level',
                    {
                        fontSize: '48px',
                        fontStyle: 'bold',
                        fontFamily: 'Arial',
                        align: 'center',
                        color: '#ffffff',
                    },
                    { useHandCursor: true },
                    /** @this restartButton */
                    function () {
                        this.setStyle({ color: '#dddd00' });
                    },
                    /** @this restartButton */
                    function () {
                        this.setStyle({ color: '#ffffff' });
                    },
                    () => {
                        this.sound.stopAll();
                        this.sound.play(Constants.RESOURCE.AUDIO.SELECT, {
                            volume: 0.2,
                        });
                        this.scene.start(this._nextScene);
                    }
                );
                objects.push(nextLevelButton);
            }
        }

        // create the restart button
        const restartButton = Utils.createTextButton(
            this,
            0,
            objects[objects.length - 1].y +
                objects[objects.length - 1].displayHeight +
                50,
            'Restart',
            {
                fontSize: '48px',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                align: 'center',
                color: '#ffffff',
            },
            { useHandCursor: true },
            /** @this restartButton */
            function () {
                this.setStyle({ color: '#dddd00' });
            },
            /** @this restartButton */
            function () {
                this.setStyle({ color: '#ffffff' });
            },
            () => {
                this.sound.stopAll();
                this.sound.play(Constants.RESOURCE.AUDIO.SELECT, {
                    volume: 0.2,
                });
                this.scene.start(this._currentScene);
            }
        );
        objects.push(restartButton);

        // create the back to title button
        const backTitleButton = Utils.createTextButton(
            this,
            0,
            restartButton.y + restartButton.displayHeight + 50,
            'Back To Title',
            {
                fontSize: '48px',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                align: 'center',
                color: '#ffffff',
            },
            { useHandCursor: true },
            /** @this restartButton */
            function () {
                this.setStyle({ color: '#dddd00' });
            },
            /** @this restartButton */
            function () {
                this.setStyle({ color: '#ffffff' });
            },
            () => {
                this.sound.stopAll();
                this.sound.play(Constants.RESOURCE.AUDIO.SELECT, {
                    volume: 0.2,
                });
                this.scene.start(Constants.SCENE.TITLE);
            }
        );
        objects.push(backTitleButton);

        // center all objects horizontally and vertically in the scene
        Utils.centerInScene(this, objects, true, true);
    }
}
