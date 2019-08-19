/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { PluginStateObject as PSO, PluginStateTransform } from '../../../../mol-plugin/state/objects';
import { ParamDefinition as PD } from '../../../../mol-util/param-definition';
import { Structure } from '../../../../mol-model/structure';
import { Task } from '../../../../mol-task';
import { CellPack as _CellPack, Cell, CellPacking } from './data';
import { createStructureFromCellPack } from './model';

export class CellPack extends PSO.Create<_CellPack>({ name: 'CellPack', typeClass: 'Object' }) { }

export { ParseCellPack }
type ParseCellPack = typeof ParseCellPack
const ParseCellPack = PluginStateTransform.BuiltIn({
    name: 'parse-cellpack',
    display: { name: 'Parse CellPack', description: 'Parse CellPack from JSON data' },
    from: PSO.Format.Json,
    to: CellPack
})({
    apply({ a }) {
        return Task.create('Parse CellPack', async ctx => {
            const cell = a.data as Cell

            const packings: CellPacking[] = []
            const { compartments, cytoplasme } = cell
            if (compartments) {
                for (const name in compartments) {
                    const { surface, interior } = compartments[name]
                    if (surface) packings.push({ name, location: 'surface', ingredients: surface.ingredients })
                    if (interior) packings.push({ name, location: 'interior', ingredients: interior.ingredients })
                }
            }
            if (cytoplasme) packings.push({ name: 'Cytoplasme', location: 'cytoplasme', ingredients: cytoplasme.ingredients })

            return new CellPack({ cell, packings });
        });
    }
});

export { StructureFromCellpack }
type StructureFromCellpack = typeof ParseCellPack
const StructureFromCellpack = PluginStateTransform.BuiltIn({
    name: 'structure-from-cellpack',
    display: { name: 'Structure from CellPack', description: 'Create Structure from CellPack Packing' },
    from: CellPack,
    to: PSO.Molecule.Structure,
    params: a => {
        if (!a) {
            return {
                packing: PD.Numeric(0, {}, { description: 'Packing Index' }),
                baseUrl: PD.Text('https://cdn.jsdelivr.net/gh/mesoscope/cellPACK_data@master/')
            };
        }
        const options = a.data.packings.map((d, i) => [i, d.name] as [number, string])
        return {
            packing: PD.Select(0, options),
            baseUrl: PD.Text('https://cdn.jsdelivr.net/gh/mesoscope/cellPACK_data@master/')
        }
    }
})({
    apply({ a, params }) {
        return Task.create('Structure from CellPack', async ctx => {
            const packing = a.data.packings[params.packing]
            const structure = await createStructureFromCellPack(packing, params.baseUrl).runInContext(ctx)
            return new PSO.Molecule.Structure(structure, { label: packing.name })
        });
    }
});

export { AddStructure }
type AddStructure = typeof AddStructure
const AddStructure = PluginStateTransform.BuiltIn({
    name: 'add-structure',
    display: { name: 'Add Structure', description: 'Add existing molecular structure.' },
    from: PSO.Root,
    to: PSO.Molecule.Structure,
    params: {
        structure: PD.Value<Structure>(Structure.Empty),
        label: PD.Text('Structure')
    }
})({
    apply({ a, params }) {
        return Task.create('Build Structure', async ctx => {
            const s = params.structure
            const props = { label: params.label, description: s.elementCount === 1 ? '1 element' : `${s.elementCount} elements` };
            return new PSO.Molecule.Structure(s, props);
        })
    }
});