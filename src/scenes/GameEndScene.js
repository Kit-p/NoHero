import Phaser from 'phaser';

import Constants from '../classes/Constants';
import Utils from '../classes/Utils';

export class GameEndScene extends Phaser.Scene {
    /** @protected @type {boolean} Whether the player has victory. */
    _isVictory;

    constructor() {
        super({ key: Constants.SCENE.GAME_END });
    }

    /**
     * @param {object} data The scene data object.
     * @param {boolean} data.isVictory Wether the player has victory.
     */
    init(data) {
        this._isVictory = data.isVictory === true ? true : false;
        this.scale.setGameSize(800, 600);
    }

    create() {
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

        // center all objects horizontally and vertically in the scene
        Utils.centerInScene(this, [title, description], true, true);
    }
}
