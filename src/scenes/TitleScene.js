import Phaser from 'phaser';

import Constants from '../classes/Constants';
import Utils from '../classes/Utils';

export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: Constants.SCENE.TITLE });
    }

    preload() {
        for (const value of Object.values(Constants.RESOURCE.AUDIO)) {
            this.sound.add(value);
        }
    }

    init() {
        this.scale.setGameSize(800, 600);
        this.sound.play(Constants.RESOURCE.AUDIO.BGM, {
            volume: 0.2,
            loop: true,
        });
    }

    create() {
        // set background image
        this.add
            .image(
                this.game.canvas.width / 2,
                this.game.canvas.height / 2,
                Constants.RESOURCE.IMAGE.BACKGROUND
            )
            .setOrigin(0.5)
            .setScale(2)
            .setAlpha(0.75);

        // create game title
        const title = this.add.text(0, 25, 'NO HERO', {
            fontSize: '96px',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            align: 'center',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 5,
            shadow: {
                offsetX: 10,
                offsetY: -10,
                color: '#222222',
                blur: 5,
                fill: true,
            },
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
                align: 'center',
                color: '#ffffff',
            },
            { useHandCursor: true },
            /** @this playButton */
            function () {
                this.setStyle({ color: '#dddd00' });
            },
            /** @this playButton */
            function () {
                this.setStyle({ color: '#ffffff' });
            },
            () => {
                this.sound.stopAll();
                this.sound.play(Constants.RESOURCE.AUDIO.SELECT, {
                    volume: 0.2,
                });
                this.scene.start(Constants.SCENE.LEVELS?.[0]);
            }
        );

        // center all objects horizontally in the scene
        Utils.centerInScene(this, [title, playButton], true, true);
    }
}
