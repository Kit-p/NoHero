import Phaser from 'phaser';

import { PreloaderScene } from './scenes/PreloaderScene';
import { TitleScene } from './scenes/TitleScene';
import { GameUIScene } from './scenes/GameUIScene';
import { GameEndScene } from './scenes/GameEndScene';
import { Level01Scene } from './scenes/levels/Level01Scene';
import { Level02Scene } from './scenes/levels/Level02Scene';
import { Level03Scene } from './scenes/levels/Level03Scene';

export default new Phaser.Game({
    title: 'No Hero',
    type: Phaser.AUTO,
    scale: {
        parent: 'game',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
    },
    audio: {
        disableWebAudio: true,
    },
    physics: {
        default: 'arcade',
        arcade: {
            fps: 60,
            gravity: {
                y: 0,
            },
            debug: true,
            debugBodyColor: 0x00ff00,
            debugShowBody: true,
            debugShowStaticBody: true,
            debugShowVelocity: true,
            debugVelocityColor: 0xffff00,
            debugStaticBodyColor: 0x0000ff,
        },
    },
    disableContextMenu: true,
    render: {
        pixelArt: true,
    },
    scene: [
        PreloaderScene,
        TitleScene,
        Level01Scene,
        Level02Scene,
        Level03Scene,
        GameUIScene,
        GameEndScene,
    ],
});
