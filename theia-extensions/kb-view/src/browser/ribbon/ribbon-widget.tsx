/********************************************************************************
 * Copyright (C) 2025 Jeff Toffoli
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
 ********************************************************************************/

import * as React from 'react';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { RibbonItemRegistry, SidebarService, RibbonItem } from '../../common/kb-view-protocol';

export const RIBBON_WIDGET_ID = 'kb-view-ribbon';

@injectable()
export class RibbonWidget extends ReactWidget {
    static readonly ID = RIBBON_WIDGET_ID;
    static readonly LABEL = 'Ribbon';

    @inject(RibbonItemRegistry)
    protected readonly registry: RibbonItemRegistry;

    @inject(SidebarService)
    protected readonly sidebarService: SidebarService;

    protected items: RibbonItem[] = [];
    protected side: 'left' | 'right' = 'left';

    @postConstruct()
    protected init(): void {
        this.id = RIBBON_WIDGET_ID;
        this.title.label = RibbonWidget.LABEL;
        this.title.closable = false;
        this.title.iconClass = 'codicon codicon-three-bars';

        this.addClass('kb-ribbon');
        this.update();

        // Subscribe to registry changes
        this.toDispose.push(
            this.registry.onDidChange(() => {
                this.updateItems();
            })
        );

        // Subscribe to visibility changes
        this.toDispose.push(
            this.sidebarService.onVisibilityChanged(() => {
                this.update();
            })
        );

        this.updateItems();
    }

    setSide(side: 'left' | 'right'): void {
        this.side = side;
        this.updateItems();
    }

    protected updateItems(): void {
        this.items = this.registry.getItems().filter(item => item.side === this.side);
        this.update();
    }

    protected render(): React.ReactNode {
        const topItems = this.items.filter(item => item.group === 'top');
        const bottomItems = this.items.filter(item => item.group === 'bottom');

        return (
            <div className="kb-ribbon-container">
                {/* Test indicator - will be removed later */}
                <div
                    style={{
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--kb-white)',
                        background: 'var(--kb-primary)',
                        borderRadius: 'var(--kb-radius-sm)',
                        margin: '4px',
                    }}
                >
                    KB VIEW
                </div>
                <div className="kb-ribbon-group kb-ribbon-top">{topItems.map(item => this.renderRibbonItem(item))}</div>
                <div className="kb-ribbon-group kb-ribbon-bottom">{bottomItems.map(item => this.renderRibbonItem(item))}</div>
            </div>
        );
    }

    protected renderRibbonItem(item: RibbonItem): React.ReactNode {
        const isActive = this.sidebarService.isVisible(item.side, item.panelId);

        return (
            <div
                key={item.id}
                className={`kb-ribbon-item ${isActive ? 'active' : ''}`}
                title={item.tooltip}
                onClick={() => this.handleItemClick(item)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleItemClick(item);
                    }
                }}
                role="button"
                tabIndex={0}
            >
                <i className={item.icon} />
            </div>
        );
    }

    protected handleItemClick(item: RibbonItem): void {
        this.sidebarService.toggle(item.side, item.panelId);
    }
}
