import Phaser from 'phaser';

import GameScene from './scenes/GameScene';

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
        },
    },
    disableContextMenu: true,
    render: {
        pixelArt: true,
    },
    scene: [GameScene],
});
