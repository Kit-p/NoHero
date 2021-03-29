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
        this.scale.setGameSize(map.widthInPixels, map.heightInPixels);
        let groundLayer = map.createLayer('Ground', 'tile_all-in-one-2', 0, -6);
        map.setCollisionByProperty({ collides: true });
        let player = new PlayerCharacter(
            this,
            24,
            32,
            'atlas_all-in-one-2',
            'elf_m_idle_anim_f0',
            'elf_m'
        );
        player.play('idle');
        let wallLayer = map.createLayer('Wall', 'tile_all-in-one-2', 0, -6);
        map.setCollisionByProperty({ collides: true });
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        this.physics.add.collider(player, groundLayer);
        this.physics.add.collider(player, wallLayer);
        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        );
        this.cameras.main.startFollow(player, true, 0.1, 0.1);
        console.log(player);
        player.getBody().setVelocityX(15);
    }
}
