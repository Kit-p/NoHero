import Phaser from 'phaser';

import PlayerCharacter from '../characters/PlayerCharacter';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'scene_game',
            active: true,
            visible: true,
        });
    }

    init() {
        console.log(this);
    }

    preload() {
        this.load.image('tile_all-in-one-2', 'assets/tiles/all-in-one/2.png');
        this.load.tilemapTiledJSON('map_trial-01', 'assets/maps/trial-01.json');
        this.load.atlas(
            'atlas_all-in-one-2',
            'assets/tiles/all-in-one/2.png',
            'assets/tiles/atlases/all-in-one-2.json'
        );
    }

    create() {
        let map = this.add.tilemap('map_trial-01');
        map.addTilesetImage('tile_all-in-one-2');
        map.createLayer('Ground', 'tile_all-in-one-2', 0, -6);
        map.createLayer('Wall', 'tile_all-in-one-2', 0, -6);
        map.setCollisionByProperty({ collides: true });
        this.scale.setGameSize(map.widthInPixels, map.heightInPixels);
        let player = new PlayerCharacter(
            this,
            24,
            32,
            'elf_m',
            'atlas_all-in-one-2',
            'elf_m_idle_anim_f0'
        );
        player.animate('idle');
    }
}
