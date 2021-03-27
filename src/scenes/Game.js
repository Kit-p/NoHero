import Phaser from 'phaser';

export default class Game extends Phaser.Scene {
    constructor() {
        super('game');
    }

    preload() {
        this.load.image('tile_all-in-one-2', 'assets/tiles/all-in-one/2.png');
        this.load.tilemapTiledJSON('map_trial-01', 'assets/maps/trial-01.json');
    }

    create() {
        let map = this.add.tilemap('map_trial-01');
        map.addTilesetImage('tile_all-in-one-2');
        map.createLayer('Ground', 'tile_all-in-one-2', 0, -6);
        map.createLayer('Wall', 'tile_all-in-one-2', 0, -6);
        map.setCollisionByProperty({ collides: true });
        this.scale.setGameSize(map.widthInPixels, map.heightInPixels);
    }
}
