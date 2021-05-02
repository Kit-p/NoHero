import Constants from '../../classes/Constants';
import { GameScene } from '../GameScene';
import { PlayerCharacter } from '../../characters/PlayerCharacter';
import { StrongAIControlState } from '../../states/StrongAIControlState';

/**
 * @extends GameScene
 */
export class Level03Scene extends GameScene {
    constructor() {
        super({ key: Constants.SCENE.LEVELS[2] }, Constants.SCENE.LEVELS?.[3]);

        // set level specific constants
        this._potionCount = {
            player: {
                small: 9,
                large: 3,
            },
            enemy: {
                small: 3,
                large: 1,
            },
        };

        this._potionHealing = {
            small: 1,
            large: 3,
        };

        this._spikeCount = 8;
    }

    /**
     * @override
     */
    create() {
        const player1 = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'chort_idle_anim_f0',
            {
                name: 'chort',
                maxHealth: 6,
                movementSpeed: 32,
                projectileDamage: 1,
                type: 'player',
                cooldowns: {
                    projectile: 500,
                    dash: 5000,
                },
            }
        );
        // manually adjust the collision body size and offset
        player1.body.setSize(player1.width * 0.7, player1.height * 0.8, true);
        player1.body.setOffset(
            player1.body.width * 0.25,
            player1.body.height * 0.25
        );

        const player2 = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'wogol_idle_anim_f0',
            {
                name: 'wogol',
                maxHealth: 8,
                movementSpeed: 48,
                projectileDamage: 2,
                type: 'player',
                cooldowns: {
                    projectile: 3000,
                    dash: 3000,
                },
            }
        );
        // manually adjust the collision body size and offset
        player2.body.setSize(player2.width * 0.7, player2.height * 0.8, true);
        player2.body.setOffset(
            player2.body.width * 0.25,
            player2.body.height * 0.25
        );

        const player3 = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'necromancer_idle_anim_f0',
            {
                name: 'necromancer',
                maxHealth: 8,
                projectileDamage: 0,
                type: 'player',
                cooldowns: {
                    projectile: 5000,
                    dash: 10000,
                },
            }
        );
        // manually adjust the collision body size and offset
        player3.body.setSize(player3.width * 0.7, player3.height * 0.8, true);
        player3.body.setOffset(
            player3.body.width * 0.25,
            player3.body.height * 0.25
        );

        const knight1 = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'knight_m_idle_anim_f0',
            {
                name: 'knight_m',
                controlState: StrongAIControlState,
                maxHealth: 12,
                collideAttackDamage: 4,
                type: 'enemy',
            }
        );
        // manually adjust the collision body size and offset
        knight1.body.setSize(knight1.width * 0.75, knight1.height * 0.65, true);
        knight1.body.setOffset(
            knight1.body.width * 0.15,
            knight1.body.height * 0.5
        );

        const knight2 = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'knight_f_idle_anim_f0',
            {
                name: 'knight_f',
                controlState: StrongAIControlState,
                maxHealth: 12,
                collideAttackDamage: 4,
                type: 'enemy',
            }
        );
        // manually adjust the collision body size and offset
        knight2.body.setSize(knight2.width * 0.75, knight2.height * 0.65, true);
        knight2.body.setOffset(
            knight2.body.width * 0.15,
            knight2.body.height * 0.5
        );

        // set reference for GameUIScene to display health
        this.currentHumanControlledCharacter = player1;

        // create the map for this scene
        this._createMap(
            Constants.RESOURCE.TILEMAP.TRIAL_3,
            Constants.RESOURCE.IMAGE.ALL_IN_ONE_2,
            0,
            -6
        );

        // place the player at the top left of the map
        player1.setX(this.map.tilemap.widthInPixels * 0.1);
        player1.setY(
            this.map.tilemap.heightInPixels * 0.15 - player1.height * 0.5
        );

        // place the player at the top center of the map
        player2.setX(this.map.tilemap.widthInPixels * 0.5);
        player2.setY(
            this.map.tilemap.heightInPixels * 0.15 - player2.height * 0.5
        );

        // place the player at the top right of the map
        player3.setX(this.map.tilemap.widthInPixels * 0.9);
        player3.setY(
            this.map.tilemap.heightInPixels * 0.15 - player3.height * 0.5
        );

        // place the enemy at the bottom left of the map
        knight1.setX(this.map.tilemap.widthInPixels * 0.15);
        knight1.setY(
            this.map.tilemap.heightInPixels * 0.85 + knight1.height * 0.5
        );

        // place the enemy at the bottom right of the map
        knight2.setX(this.map.tilemap.widthInPixels * 0.85);
        knight2.setY(
            this.map.tilemap.heightInPixels * 0.85 + knight2.height * 0.5
        );

        // spawn the spikes
        this._spawnSpikes(2);

        // spawn the healing potions
        this._spawnPotions();

        // launch the UI scene to both scenes run in parallel
        this.scene.launch(Constants.SCENE.GAME_UI, { gameScene: this });

        // this._debug();
    }
}
