import Phaser from 'phaser';

import Constants from '../classes/Constants';
import Utils from '../classes/Utils';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: Constants.SCENE.TITLE });
    }

    create() {
        // create game title
        const title = this.add.text(0, 25, 'NO HERO', {
            fontSize: '96px',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            color: '#ffffff',
        });
        // create play button
        const playButton = Utils.createTextButton(
            this,
            0,
            title.y + title.displayHeight + 100,
            'Play',
            {
                fontSize: '48px',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                color: '#ffffff',
            },
            { useHandCursor: true },
            /** @this playButton */
            function () {
                this.setStyle({ color: '#ff0000' });
            },
            /** @this playButton */
            function () {
                this.setStyle({ color: '#ffffff' });
            },
            () => this.scene.start(Constants.SCENE.GAME)
        );

        // center all objects horizontally in the scene
        Utils.centerInScene(this, [title, playButton], true, false);
    }
}
