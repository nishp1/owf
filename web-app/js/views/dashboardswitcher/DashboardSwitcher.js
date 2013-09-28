/*
 * Copyright 2013 Next Century Corporation 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define([
    'models/dashboardswitcher/SwitcherTile',
    'models/DashboardInstance',
    'models/Stack',
    'collections/Collection',
    'views/View',
    'views/Modal',
    'views/Warning',
    'views/dashboardswitcher/Tiles',
    'services/FocusManager',
    'mixins/CircularFocus',
    'events/EventBus',
    'services/Notifications',
    // Libraries.
    'jquery',
    'lodash',
    'backbone'
],

function(SwitcherTile, DashboardInstance, Stack, Collection, View, Modal, Warning, Tiles, FocusManager, CircularFocus, EventBus, Notifications, $, _, Backbone) {
    'use strict';

    var tpl =
        '<div class="pull-right">' +
            '<div class="btn-group ">' +
                '<button class="btn manage-btn" tabindex="0"><i class="icon-cogs"></i>  Manage</button>' +
                '<button class="btn create-btn" tabindex="0"><i class="icon-plus"></i>  Create</button>' +
            '</div>' +
        '</div>';

    return Modal.extend({

        id: 'dashboard-switcher',

        className: 'modal hide fade',

        template: tpl,

        dashboardContainer: null,

        //dashboard unit sizes
        dashboardItemHeight: 0,
        dashboardItemWidth: 0,

        //size of switcher in dashboard units
        minDashboardsWidth: 3,
        maxDashboardsWidth: 5,
        maxDashboardsHeight: 3,

        // The tiles view for top level dashboards and stacks.
        tiles: null,

        selectedItemCls : 'dashboard-selected',

        events:  {
            'click .manage-btn': 'toggleManage',
            'click .create-btn': 'create'
        },

        footer: false,
        removeOnClose: false,

        initialize: function () {
            Modal.prototype.initialize.apply(this, arguments);
            var me = this,
                dashboard, stack, switcherTile;

            // Set the dashboard container.
            this.dashboardContainer = this.options.dashboardContainer;

            // Set the switcher to sync dashboard state with the backend on open/close.
            this._syncDashboardsOnOpenClose = true;

            // Set an internal state to determine whether or not to disable manage mode
            // on hide.  This value should be reset to false after each hide.
            this._keepManageOnHide = false;

            // Create a composite collection of stacks and dashboards.
            this.stackOrDashboards = new Collection();

            for (var i = 0, len = this.options.dashboardInstances.length; i < len; i ++) {
                // Get the dashboard.
                dashboard = this.options.dashboardInstances.at(i);
                me.addSwitcherItemForDashboard(dashboard);
            }

            this.tiles = new Tiles({
                collection: this.stackOrDashboards
            });

            this.listenTo(this.tiles, {
                'tiles:rearrange': _.bind(this.onTileRearrange, this),
                'dashboard:click': _.bind(this.onDashboardClick, this),
                'dashboard:delete': _.bind(this.onDashboardDelete, this),
                'dashboard:edit': _.bind(this.onDashboardEdit, this),
                'dashboard:share': _.bind(this.onDashboardShare, this),
                'dashboard:restore': _.bind(this.onDashboardRestore, this),
                'stack:restore': _.bind(this.onStackRestore, this),
                'stack:delete': _.bind(this.onStackDelete, this)
            });

            // Listen to the main instances collection for adds & deletes.
            this.listenTo(this.options.dashboardInstances, {

                'add': _.bind(me.addSwitcherItemForDashboard, this)
            });
        },

        render: function  () {
            Modal.prototype.render.call(this);

            this.$body.html(this.tiles.render().$el);
            this.$el.append(this.template);

            this.initCircularFocus();
            this._$manageButton = this.$el.find('.manage-btn');
            this._$createButton = this.$el.find('.create-btn');

            return this;
        },

        /**
         * Displays the switcher.
         */
        show: function () {

            var dashboardInstances = this.options.dashboardInstances;
            
            // Fetch the latest dashboards, after saving current state.
            if (this._syncDashboardsOnOpenClose && dashboardInstances) {
                dashboardInstances.fetch({parse: true, update: true, remove: true, merge: false});
            }

            // Re-enable sync on show.
            this._syncDashboardsOnOpenClose = true;

            // Display the switcher.
            return Modal.prototype.show.call(this);
        },

        hide: function (options) {
            var $focusedElement = FocusManager.activeEl();
            if (options && options.saveFocusedElementOnHide) {

                // Cache our last focused element.
                if (this.$el.find($focusedElement)) {
                    this._$lastFocusedElement = $focusedElement;
                }
                else {
                    this._$lastFocusedElement = null;
                }
            }
            if (options && options.keepManageOnHide) {
                this._keepManageOnHide = true;
            }
            return Modal.prototype.hide.call(this, options);
        },

        onShown: function () {
            this._updateWindow();

            if (this._$lastFocusedElement && this.$el.find(this._$lastFocusedElement)) {
                // Focus the item and clear it from our focus cache before the next
                // hide/show cycle.
                this._$lastFocusedElement.focus();
                this._$lastFocusedElement = null;
            }
            // If we're already rendered, select the active dashboard.
            else if (this.isRendered && this.dashboardContainer && this.dashboardContainer.activeDashboard) {
                //this.selectDashboard(this.dashboardContainer.activeDashboard.model);
                    this.selectDashboard(this.dashboardContainer.activeDashboard.model);
            }
        },

        onHidden: function (evt) {
            // Turn off manage mode unless we are closing ourselves (e.g., to display a warning).
            if (!this._keepManageOnHide) {
                if (this.tiles.isManaging()) {
                    this.toggleManage();
                }
            }
            // Otherwise, reset the variable before we're hidden again.
            else {
                this._keepManageOnHide = false;
            }

            // Update the dashboard updateDashboardPositions
            this.updateDashboardPositions();

            // Push to the backend if necessary.
            if (this._syncDashboardsOnOpenClose) {
                this.options.dashboardInstances.sync('update', this.options.dashboardInstances, {
                    parse: true,
                    update: true,
                    remove: true
                });
            }
        },

        selectDashboard: function(dashboard) {
            // Find the stack and dashboard switcher items for this dashboard model.
            var i = 0,
                stackSwitcherItem = null,
                stacks = null,
                dashboardSwitcherItem = null;

            dashboardSwitcherItem = this.stackOrDashboards.where({switcherItem: dashboard});
            dashboardSwitcherItem = (dashboardSwitcherItem.length > 0) ? dashboardSwitcherItem[0] : null;

            // If the dashboard is not a top level dashboard, look for its parent stack.
            if (!dashboardSwitcherItem) {
                stacks = this.stackOrDashboards.where({isStack: true});
                for (i = 0; i < stacks.length; i++) {
                    dashboardSwitcherItem = stacks[i].get('children').where({switcherItem: dashboard});
                    if (dashboardSwitcherItem.length > 0) {
                        dashboardSwitcherItem = dashboardSwitcherItem[0];
                        stackSwitcherItem = stacks[i];
                        break;
                    }
                    else {
                        dashboardSwitcherItem = null;
                    }
                }
            }

            // If we found it, select it in our tiles view.
            if (dashboardSwitcherItem) {
                this.tiles.select(dashboardSwitcherItem, stackSwitcherItem);
            }
        },

        updateDashboardPositions: function () {
            var i = 0,
                j = 0,
                position = 0,
                dashboard,
                children;

            for (i = 0; i < this.stackOrDashboards.length; i++) {
                if (this.stackOrDashboards.at(i).get('isStack')) {
                    children = this.stackOrDashboards.at(i).get('children');
                    for (j = 0; j < children.length; j++) {
                        dashboard = children.at(j).get('switcherItem');
                        dashboard.set('position', position++);
                    }
                }
                else {
                    dashboard = this.stackOrDashboards.at(i).get('switcherItem');
                    dashboard.set('position', position++);
                }
            }
        },

        /**
         * Accepts a DashboardModel and attempts to add it to the Tiles.  If it belongs to a stack, it will attempt to
         * put the dashboard in a stack switcher model.
         */
        addSwitcherItemForDashboard: function(dashboard) {
            var me = this,
                template = dashboard.get('dashboardTemplate'),
                stack = (template) ? template.stack : null,
                //stack = dashboard.get('stack'),
                switcherTile;

            // Check if the dashboard belongs in a stack.
            if (stack) {

                // If we had the stack already
                if (me.stackOrDashboards.get(stack.id)) {
                    me.stackOrDashboards.get(stack.id).get('children').add(new SwitcherTile({
                        switcherItem:dashboard,
                        isStack: false
                    }));
                }
                // if have not encountered that stack already...
                else {
                    // Create a switcher model for the new stack.
                    switcherTile = new SwitcherTile({
                        id: stack.id,
                        switcherItem: new Stack(stack),
                        isStack: true,
                        children: new Collection()
                    });

                    // Add the dashboard to the switcher model for the stack.
                    switcherTile.get('children').add(new SwitcherTile({
                        id: dashboard.get('id'),
                        switcherItem: dashboard,
                        isStack: false
                    }));

                    // if view is rendered, only add model after view is shown
                    // so that it can be placed before or after stack dashboards
                    if(this.isRendered) {
                        me.$el.one('shown', function () {
                            me.stackOrDashboards.add(switcherTile);
                            me._updateWindow();
                        });
                    }
                    else {
                        me.stackOrDashboards.add(switcherTile);
                    }
                }

            }
            else {
                // Otherwise, add the dashboard
                switcherTile = new SwitcherTile({
                    id: dashboard.get('id'),
                    switcherItem: dashboard,
                    isStack: false
                });

                // if view is rendered, only add model after view is shown
                // so that it can be placed before or after stack dashboards
                if(this.isRendered) {
                    me.$el.one('shown', function () {
                        me.stackOrDashboards.add(switcherTile);
                        me._updateWindow();
                    });
                }
                else {
                    me.stackOrDashboards.add(switcherTile);
                }
            }
        },

        /**
         * Removes a stack from the switcher and triggers the destroy event
         * on any dashboards in this stack to bubble up their removal as well.
         * @param stack The stack to remove.  Expects a model with a valid stack id.
         */
        removeSwitcherItemForStack: function(stack) {
            var me = this,
                i = 0,
                dashboards,
                dashboard,
                stackSwitcherItem = me.stackOrDashboards.get(stack.get('id'));

            if (stackSwitcherItem) {
                dashboards = stackSwitcherItem.get('children');
                // Trigger destroy on the dashboards contained in this stack.
                for (i = 0; i < dashboards.length; i++) {
                    dashboard = dashboards.at(i);
                    dashboard.get('switcherItem').trigger('destroy', dashboard, dashboard.collection);
                }

                // Remove the stack's switcher item.
                me.stackOrDashboards.remove(stackSwitcherItem);
            }
        },

        onTileRearrange: function () {
            this.reinitCircularFocus();
        },

        onDashboardClick: function (model) {
            this.hide().then(function () {
                EventBus.trigger('dashboard:switch', model);
            });
        },

        onStackRestore: function (model) {
            var me = this,
                modal;

            if (model) {
                // Warn the user this action is permanent. 
                modal = new Warning({
                    title: 'Warning',
                    content: 'This action will return the stack ' + _.escape(model.get('name')) +
                        ' to its current default state.  If an administrator changed any dashboard in the stack' +
                        ' after it was assigned to you, the default state may differ from the one that' +
                        ' originally appeared in your Switcher.',
                    removeOnClose: true,
                    ok: function() {
                        this.hide().then(function() {

                            $.ajax({
                                url: '/ozp/rest/owf/stacks/' + model.get('id') + '/restore',
                                type: 'post',
                                dataType: 'json',
                                success: function(data, textStatus, jqXHR) {
                                    var i = 0,
                                        restoredModel = null;
                                    // Add the restored values to their dashboard instance collection.
                                    me.options.dashboardInstances.add(data, {parse: true, merge: true});
                                    // Fire a restore event on each of the stack dashboards.
                                    for (i = 0; i < data.length; i++) {
                                        restoredModel = me.options.dashboardInstances.get(data[i].id);
                                        EventBus.trigger('dashboard:restore', restoredModel);
                                    }
                                    Notifications.notify('<strong>Restore Stack</strong><br><strong>' +
                                        _.escape(model.get('name')) +
                                        '</strong> has been restored!', 'success');
                                },
                                error: function(jqXHR, textStatus, errorThrown) {
                                    Notifications.notify('<strong>Restore Stack</strong><br>' +
                                        errorThrown, 'error');
                                }
                            });

                        });
                        return false;
                    }
                });

                this._syncDashboardsOnOpenClose = false;
                this.hide({
                    saveFocusedElementOnHide: true,
                    keepManageOnHide: true
                }).then(function() {
                    modal.show();
                });

                modal.$el.one('hidden', function () {
                    me._syncDashboardsOnOpenClose = true;
                    me.show();
                });
            }
        },

        onStackDelete: function (model) {
            var me = this,
                modal;

            // Check if the user has a group association to this stack. If so, warn them that they cannot
            // delete it.
            if (model.get('groups') && (model.get('groups').length > 0)) {
                modal = new Warning({
                    title: 'Warning',
                    content: 'Users in a group cannot remove stacks assigned to the group.' +
                        '  Please contact your administrator.',
                    removeOnClose: true,
                    cancelText: false,
                    ok: function() {
                        this.hide();
                        return false;
                    }
                });
            }
            // Otherwise, confirm their desire to delete this
            else {
                // Warn the user this action is permanent. 
                modal = new Warning({
                    title: 'Warning',
                    content: 'This will permanently delete stack ' + _.escape(model.get('name')) +
                        ' and its dashboards.',
                    removeOnClose: true,
                    ok: function() {
                        this.hide().then(function() {
                            $.ajax({
                                url: '/ozp/rest/owf/stacks/' + model.get('id') + '/persons/me',
                                type: 'DELETE',
                                success: function(data, textStatus, jqXHR) {
                                    me.removeSwitcherItemForStack(model);
                                    me._updateWindow();
                                    Notifications.notify('<strong>Delete Stack</strong><br><strong>' +
                                        _.escape(model.get('name')) +
                                        '</strong> has been deleted!', 'success');
                                },
                                error: function(jqXHR, textStatus, errorThrown) {
                                    Notifications.notify('<strong>Delete Stack</strong><br>' +
                                        errorThrown, 'error');
                                }
                            });
                        });
                        return false;
                    }
                });
            }

            // Replace the switcher with the confirmation modal.
            this._syncDashboardsOnOpenClose = false;
            this.hide({saveFocusedElementOnHide: true,
                keepManageOnHide: true
            }).then(function() {
                modal.show();
            });

            // Reshow the switcher after the action.
            modal.$el.one('hidden', function () {
                me.show();
            });
        },

        onDashboardRestore: function (model) {
            var me = this,
                modal;

            if (model) {
                // Warn the user that personal dashboards cannot be restored.
                if (!model.get('dashboardTemplate')) {
                    modal = new Warning({
                        title: 'Information',
                        content: 'Only dashboards received through Groups or Stacks can be restored to their ' +
                                 'default state.',
                        removeOnClose: true,
                        cancelText: false,
                        ok: function() {
                            this.hide();
                            return false;
                        }
                    });
                }
                else {
                    // Warn the user this action is permanent. 
                    modal = new Warning({
                        title: 'Warning',
                        content: 'This action will return the dashboard ' + _.escape(model.get('name')) +
                            ' to its current default state.  If an administrator changed the dashboard after' +
                            ' it was assigned to you, the default state may differ from the one that' +
                            ' originally appeared in your Switcher',
                        removeOnClose: true,
                        ok: function() {
                            this.hide().then(function() {

                                model.restore({
                                    parse: true,
                                    success: function(model, response) {
                                        EventBus.trigger('dashboard:restore', model);
                                        Notifications.notify('<strong>Restore Dashboard</strong><br><strong>' +
                                            _.escape(model.get('name')) +
                                            '</strong> has been restored!', 'success');
                                    },
                                    error: function(model, response) {
                                        Notifications.notify('<strong>Restore Dashboard</strong><br>' +
                                            response.statusText, 'error');
                                    }
                                });
                            });
                            return false;
                        }
                    });
                }

                this._syncDashboardsOnOpenClose = false;
                this.hide({saveFocusedElementOnHide: true,
                    keepManageOnHide: true
                }).then(function() {
                    modal.show();
                });

                modal.$el.one('hidden', function () {
                    me._syncDashboardsOnOpenClose = false;
                    me.show();
                });
            }
        },

        onDashboardDelete: function (model) {
            var me = this,
                modal;

            // if this dashboard belongs to a stack, warn the user they cannot delete it.
            if (model.get('dashboardTemplate') && model.get('dashboardTemplate').stack) {
                modal = new Warning({
                    title: 'Warning',
                    content: 'Users cannot remove individual dashboards from a stack.  Please contact your administrator.',
                    removeOnClose: true,
                    cancelText: false,
                    ok: function() {
                        this.hide();
                        return false;
                    }
                });
            }
            // if the dashboard came from a group, warn the user the user to contact their admin.
            else if (model.get('groups') && model.get('groups').length > 0) {
                modal = new Warning({
                    title: 'Warning',
                    content: 'Users cannot remove dashboards assigned to a group.  Please contact your administrator.',
                    removeOnClose: true,
                    cancelText: false,
                    ok: function() {
                        this.hide();
                        return false;
                    }
                });
            }
            // Otherwise, confirm that they want to delete it.
            else {
                // Warn the user this action is permanent. 
                modal = new Warning({
                    title: 'Warning',
                    content: 'This will permanently delete ' + _.escape(model.get('name')) + '.',
                    removeOnClose: true,
                    ok: function() {
                        this.hide().then(function() {

                            model.destroy({
                                wait: true,
                                success: function(model, response) {
                                    me._updateWindow();
                                    Notifications.notify('<strong>Delete Dashboard</strong><br><strong>' +
                                        model.get('name') +
                                        '</strong> has been deleted!', 'success');
                                },
                                error: function(model, response) {
                                    Notifications.notify('<strong>Delete Dashboard</strong><br>' +
                                        response.statusText, 'error');
                                }
                            });
                        });
                        return false;
                    }
                });
            }

            this._syncDashboardsOnOpenClose = false;
            this.hide({saveFocusedElementOnHide: true,
                keepManageOnHide: true
            }).then(function() {
                modal.show();
            });

            // Turn off data sync since we're just switching to a warning dialog momentarily.
            modal.$el.one('hidden', function () {
                me._syncDashboardsOnOpenClose = false;
                me.show();
            });
        },

        onDashboardEdit: function (model) {
            this.hide().then(function () {
                EventBus.trigger('dashboard:edit', model);
            });
        },

        onDashboardShare: function (dashboard) {
            var dashboardClone,
                $form,
                $input,
                elInput,
                elForm;

            dashboardClone = dashboard.clone();

            elForm = document.createElement('form');
            elInput = document.createElement('input');
            elInput.id = 'json';
            elInput.name = 'json';
            elInput.type = 'hidden';
            elInput.value = _.escape(dashboardClone.toJSON());
            elForm.appendChild(elInput);
            // TODO: Replace current absolute path with owf context path when added.
            // elForm.action = Ozone.util.contextPath() + '/ozp/rest/owf/persons/me/dashboard-instances/' + dashboard.get('id') + '/share';
            elForm.action = '/ozp/rest/owf/persons/me/dashboard-instances/' + dashboard.get('id') + '/share';
            elForm.method = 'POST';
            elForm.enctype = elForm.encoding = 'multipart/form-data';
            document.body.appendChild(elForm);
            elForm.submit();
            document.body.removeChild(elForm);
            elForm = null;
            elInput = null;

        },

        toggleManage: function (evt) {
            this._$manageButton.toggleClass('active');
            this.tiles.toggleManage();
            this.selectDashboard(this.dashboardContainer.activeDashboard.model);
        },

        create: function () {
            this.hide().then(function () {
                EventBus.trigger('dashboard:create');
            });
        },

        _updateWindow: function() {
            this._updateWindowSize();
            this._updateOpenStackPosition();
        },

        _updateWindowSize: function() {
            var newWidth,
                newHeight,
                $item = $(">:first-child", this.tiles.$el);
            if(!$item) {
                return;
            }

            var totalDashboards = this.stackOrDashboards.size(),
                itemOuterWidth = $item.outerWidth(true),
                itemOuterHeight = $item.outerHeight(true),
                dashboardInRow = 0;

            if(totalDashboards < this.minDashboardsWidth) {
                dashboardInRow = this.minDashboardsWidth;
            }
            else if (totalDashboards > this.maxDashboardsWidth) {
                dashboardInRow = this.maxDashboardsWidth;
            }
            else {
                dashboardInRow = totalDashboards;
            }

            // width of item container = item outer width * items in a row
            newWidth = itemOuterWidth * dashboardInRow;

            // width of window = width of item container + body's border + body's padding
            newWidth = newWidth + this.$body.outerWidth() - this.$body.width();

            // add 30 to accomodate for scrollbar
            newWidth += 30;

            if(totalDashboards > this.maxDashboardsWidth * this.maxDashboardsHeight) {
                newHeight = itemOuterHeight * this.maxDashboardsHeight;
            }

            this.css({
                height: newHeight,
                width: newWidth
            });
            this.center();
        },

        _updateOpenStackPosition: function() {
            // Reposition any open stacks.
            if (this.tiles && this.tiles.openStackView) {
                this.tiles.positionSubTiles(this.tiles.openStackView, this.tiles.stackDashboards);
            }
        }

    });

});
