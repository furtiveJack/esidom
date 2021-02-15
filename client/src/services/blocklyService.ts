/* eslint-disable no-param-reassign */
import type { WorkspaceSvg } from 'blockly';
import Blockly from 'blockly';
import esidomGenerator from '../routes/automation/esidomGenerator';
import EntityService from './entityService';
import type { Entity } from '../../types/entityType';
import type { Service } from '../../types/serviceType';
import type { EntityWithServices } from '../../types/entityWithServicesType';
import type { EnvironmentBlockly } from '../../types/environmentBlocklyType';
import type { BlocksDefinitions } from '../routes/automation/esidomBlocks';
import COLORS from '../routes/automation/esidomConst';
import BlocklyObjects from '../routes/automation/blocklyObject';
import type { ObjectBlock } from '../../types/objectsBlockType';

interface BlockFactory {
    (objectBlock: ObjectBlock): void;
}

interface Type {
    name: string;
    friendlyName: string,
    createBlock: BlockFactory;
}

const TYPES: Type[] = [
    {
        name: 'binary_sensor',
        friendlyName: 'Capteur Binaire',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.binary_sensor = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
    {
        name: 'person',
        friendlyName: 'Personne',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.person = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
    {
        name: 'weather',
        friendlyName: 'Météo',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.weather = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
    {
        name: 'zwave',
        friendlyName: 'Zwave',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.zwave = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
    {
        name: 'sensor',
        friendlyName: 'Capteur',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.sensor = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
    {
        name: 'light',
        friendlyName: 'Lampe',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.light = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
    {
        name: 'automation',
        friendlyName: 'Routine',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.automation = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
    {
        name: 'switch',
        friendlyName: 'Interrupteur',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.switch = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
    {
        name: 'media_player',
        friendlyName: 'Lecteur multimédia',
        createBlock(objectBlock: ObjectBlock): void {
            ((block: BlocksDefinitions) => {
                block.media_player = {
                    init() {
                        this.jsonInit(objectBlock);
                    },
                };
            })(Blockly.Blocks as unknown as BlocksDefinitions);
        },
    },
];

export default class BlocklyService {
    private toolbox: string | HTMLElement | undefined;

    private workspace: WorkspaceSvg;

    constructor(toolbox: string | HTMLElement | undefined, workspace: WorkspaceSvg) {
        this.toolbox = toolbox;
        this.workspace = workspace;
    }

    convertToBlock(): void {
        const code = esidomGenerator.workspaceToCode(this.workspace);

        try {
            const json = JSON.parse(code);
            json.alias = 'test 3';
            json.description = 'test description';

            // TODO: send the json to HA
            console.log(JSON.stringify(json));
        } catch (e) {
            alert(e);
        }
    }

    static async initBlockly(): Promise<void> {
        const entities = await EntityService.getEntities();
        const services = await EntityService.getServices();

        this.createEntities(entities, services);
        this.createObjects(entities);
    }

    static createEntities(entities: Entity[], services: Service[]): void {
        const entityWithServices: EntityWithServices[] = [];

        entities.forEach((entity: Entity) => {
            const tmpServices: string[] = services
                .filter((service: Service) => service.name.split('.')[0] === entity.type)
                .map((service: Service) => service.name);

            if (tmpServices.length > 0) {
                entityWithServices.push({
                    id: entity.id,
                    name: entity.name,
                    services: tmpServices,
                });
            }
        });

        ((block: BlocksDefinitions) => {
            block.objet_action = {
                init() {
                    const tmpDropdown1 = entityWithServices.map((
                        entity: EntityWithServices,
                        index: number,
                        array: EntityWithServices[],
                    ) => {
                        if (entity.name === null || entity.name === '') {
                            entity.name = 'Nom inconnu';
                        }
                        return [entity.name, index.toString()];
                    });

                    const dropdown1 = tmpDropdown1.length > 0 ? tmpDropdown1 : [['Pas de nom', 'Pas de nom']];

                    const dropdown2 = entityWithServices[0]
                        ?.services.map((service: string) => [service, service])
                        ?? [['Action inconnue', 'Action inconnue']];

                    this.appendDummyInput()
                        .appendField('Objet : ')
                        .appendField(new Blockly.FieldDropdown(dropdown1), 'entity');
                    this.appendDummyInput('services')
                        .appendField('Action :')
                        .appendField(new Blockly.FieldDropdown(dropdown2), 'services');
                    this.setInputsInline(false);
                    this.setPreviousStatement(true, 'Action');
                    this.setNextStatement(true, 'Action');
                    this.setColour(COLORS.HUE_ORANGE);
                    this.setTooltip('');
                    this.setHelpUrl('');
                },
                onchange(ev: EnvironmentBlockly) {
                    if (ev.name === 'entity') {
                        const index = parseInt(ev.newValue, 10);
                        const newDropdown = entityWithServices[index]
                            ?.services.map((service: string) => [service, service])
                            ?? [['Action inconnu', 'Action inconnu']];

                        this.removeInput('services');
                        this.appendDummyInput('services')
                            .appendField('Action :')
                            .appendField(
                                new Blockly.FieldDropdown(newDropdown),
                                'service',
                            );
                    }
                },
            };
        })(Blockly.Blocks as unknown as BlocksDefinitions);
    }

    static createObjects(entities: Entity[]): void {
        TYPES.forEach((type: Type) => {
            const typeName = type.name;
            const options: string[][] = entities
                .filter((entity: Entity) => entity.type === typeName)
                .map((entity: Entity) => [entity.name === '' ? 'Pas de nom' : entity.name, entity.id]);

            const blocklyObjects = new BlocklyObjects(
                typeName,
                typeName.charAt(0).toUpperCase() + typeName.slice(1),
                type.friendlyName,
                0,
            );

            blocklyObjects.addOptions(options);
            const objectBlock = blocklyObjects.getJson();
            type.createBlock(objectBlock);
        });
    }
}
