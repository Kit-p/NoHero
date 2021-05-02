import Constants from '../../classes/Constants';
import { GameScene } from '../GameScene';
import { PlayerCharacter } from '../../characters/PlayerCharacter';
import { StrongAIControlState } from '../../states/StrongAIControlState';

/**
 * @extends GameScene
 */
export class Level02Scene extends GameScene {
    constructor() {
        super({ key: Constants.SCENE.LEVELS[1] }, Constants.SCENE.LEVELS?.[2]);

        // set level specific constants
        this._potionCount = {
            player: {
                small: 6,
                large: 2,
            },
            enemy: {
                small: 6,
                large: 2,
            },
        };

        this._potionHealing = {
            small: 2,
            large: 6,
        };

        this._spikeCount = 4;
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
            'orc_shaman_idle_anim_f0',
            {
                name: 'orc_shaman',
                maxHealth: 12,
                projectileDamage: 2, // * will tick for multiple times
                type: 'player',
                cooldowns: {
                    projectile: 5000,
                    dash: 2000,
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
                maxHealth: 16,
                projectileDamage: 6,
                type: 'player',
                cooldowns: {
                    projectile: 3000,
                    dash: 2000,
                },
            }
        );
        // manually adjust the collision body size and offset
        player2.body.setSize(player2.width * 0.7, player2.height * 0.8, true);
        player2.body.setOffset(
            player2.body.width * 0.25,
            player2.body.height * 0.25
        );

        const wizard1 = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'wizard_m_idle_anim_f0',
            {
                name: 'wizard_m',
                controlState: StrongAIControlState,
                maxHealth: 8,
                movementSpeed: 32,
                projectileDamage: 4,
                cooldowns: {
                    projectile: 1500,
                },
                type: 'enemy',
            }
        );
        // manually adjust the collision body size and offset
        wizard1.body.setSize(wizard1.width * 0.75, wizard1.height * 0.65, true);
        wizard1.body.setOffset(
            wizard1.body.width * 0.15,
            wizard1.body.height * 0.5
        );

        const wizard2 = new PlayerCharacter(
            this,
            0,
            0,
            Constants.RESOURCE.ATLAS.ALL_IN_ONE_2,
            'wizard_f_idle_anim_f0',
            {
                name: 'wizard_f',
                controlState: StrongAIControlState,
                maxHealth: 8,
                movementSpeed: 32,
                projectileDamage: 4,
                cooldowns: {
                    projectile: 1500,
                },
                type: 'enemy',
            }
        );
        // manually adjust the collision body size and offset
        wizard2.body.setSize(wizard2.width * 0.75, wizard2.height * 0.65, true);
        wizard2.body.setOffset(
            wizard2.body.width * 0.15,
            wizard2.body.height * 0.5
        );

        // set reference for GameUIScene to display health
        this.currentHumanControlledCharacter = player1;

        // create the map for this scene
        this._createMap(
            Constants.RESOURCE.TILEMAP.TRIAL_2,
            Constants.RESOURCE.IMAGE.ALL_IN_ONE_2,
            0,
            -6
        );

        // place the player at the top left of the map
        player1.setX(this.map.tilemap.widthInPixels * 0.25);
        player1.setY(
            this.map.tilemap.heightInPixels * 0.15 - player1.height * 0.5
        );

        // place the player at the top right of the map
        player2.setX(this.map.tilemap.widthInPixels * 0.75);
        player2.setY(
            this.map.tilemap.heightInPixels * 0.15 - player2.height * 0.5
        );

        // place the enemy at the bottom left of the map
        wizard1.setX(this.map.tilemap.widthInPixels * 0.25);
        wizard1.setY(
            this.map.tilemap.heightInPixels * 0.75 + wizard1.height * 0.5
        );

        // place the enemy at the bottom right of the map
        wizard2.setX(this.map.tilemap.widthInPixels * 0.75);
        wizard2.setY(
            this.map.tilemap.heightInPixels * 0.75 + wizard2.height * 0.5
        );

        // spawn the spikes
        this._spawnSpikes(3);

        // spawn the healing potions
        this._spawnPotions();

        // launch the UI scene to both scenes run in parallel
        this.scene.launch(Constants.SCENE.GAME_UI, { gameScene: this });

        // this._debug();
    }
}
