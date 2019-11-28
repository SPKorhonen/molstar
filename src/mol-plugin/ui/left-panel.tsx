/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import * as React from 'react';
import { PluginUIComponent } from './base';
import { StateTree } from './state/tree';
import { IconButton, SectionHeader } from './controls/common';
import { StateObjectActions } from './state/actions';
import { StateTransform } from '../../mol-state';
import { PluginCommands } from '../command';
import { ParameterControls } from './controls/parameters';
import { Canvas3DParams } from '../../mol-canvas3d/canvas3d';
import { ParamDefinition as PD } from '../../mol-util/param-definition';
import { StateSnapshots, RemoteStateSnapshots } from './state/snapshots';
import { HelpContent } from './viewport/help';

type TabName = 'none' | 'root' | 'data' | 'states' | 'settings' | 'help'

export class LeftPanelControls extends PluginUIComponent<{}, { tab: TabName }> {
    state = { tab: 'data' as TabName };

    componentDidMount() {
        // this.subscribe(this.plugin.state.behavior.kind, () => this.forceUpdate());
    }

    set(tab: TabName) {
        if (this.state.tab === tab) {
            this.setState({ tab: 'none' });
            PluginCommands.Layout.Update.dispatch(this.plugin, { state: { regionState: { ...this.plugin.layout.state.regionState, left: 'collapsed' } } });
            return;
        }

        switch (tab) {
            case 'data': this.plugin.state.setKind('data'); break;
            case 'settings': this.plugin.state.setKind('behavior'); break;
        }

        this.setState({ tab });
        if (this.plugin.layout.state.regionState.left !== 'full') {
            PluginCommands.Layout.Update.dispatch(this.plugin, { state: { regionState: { ...this.plugin.layout.state.regionState, left: 'full' } } });
        }
    }

    tabs: { [K in TabName]: JSX.Element } = {
        'none': <></>,
        'root': <>
            <SectionHeader icon='home' title='Home' />
            <StateObjectActions state={this.plugin.state.dataState} nodeRef={StateTransform.RootRef} hideHeader={true} initiallyCollapsed={true} alwaysExpandFirst={true} />
            <RemoteStateSnapshots listOnly />
        </>,
        'data': <>
        <SectionHeader icon='flow-tree' title='State Tree' />
            <StateTree state={this.plugin.state.dataState} />
        </>,
        'states': <StateSnapshots />,
        'settings': <>
            <SectionHeader icon='settings' title='Plugin Settings' />
            <FullSettings />
        </>,
        'help': <>
            <SectionHeader icon='help-circle' title='Help' />
            <HelpContent />
        </>
    }

    render() {
        const tab = this.state.tab;

        return <div className='msp-left-panel-controls'>
            <div className='msp-left-panel-controls-buttons'>
                <IconButton icon='home' toggleState={tab === 'root'} onClick={() => this.set('root')} title='Home' />
                <IconButton icon='flow-tree' toggleState={tab === 'data'} onClick={() => this.set('data')} title='State Tree' />
                <IconButton icon='floppy' toggleState={tab === 'states'} onClick={() => this.set('states')} title='Plugin State' />
                <IconButton icon='help-circle' toggleState={tab === 'help'} onClick={() => this.set('help')} title='Help' />
                <div className='msp-left-panel-controls-buttons-bottom'>
                    <IconButton icon='settings' toggleState={tab === 'settings'} onClick={() => this.set('settings')} title='Settings' />
                </div>
            </div>
            <div className='msp-scrollable-container'>
                {this.tabs[tab]}
            </div>
        </div>;
    }
}

class FullSettings extends PluginUIComponent {
    private setSettings = (p: { param: PD.Base<any>, name: string, value: any }) => {
        PluginCommands.Canvas3D.SetSettings.dispatch(this.plugin, { settings: { [p.name]: p.value } });
    }

    componentDidMount() {
        this.subscribe(this.plugin.events.canvas3d.settingsUpdated, () => this.forceUpdate());
        this.subscribe(this.plugin.layout.events.updated, () => this.forceUpdate());
        this.subscribe(this.plugin.events.interactivity.propsUpdated, () => this.forceUpdate());
    }

    icon(name: string, onClick: (e: React.MouseEvent<HTMLButtonElement>) => void, title: string, isOn = true) {
        return <IconButton icon={name} toggleState={isOn} onClick={onClick} title={title} />;
    }

    render() {
        return <>
            {this.plugin.canvas3d && <>
                <SectionHeader title='Viewport' />
                <ParameterControls params={Canvas3DParams} values={this.plugin.canvas3d.props} onChange={this.setSettings} />
            </>}
            <SectionHeader title='Behavior' />
            <StateTree state={this.plugin.state.behaviorState} />
        </>
    }
}