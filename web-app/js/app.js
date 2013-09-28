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
    'router',
    'config',
    'collections/PersonalWidgetDefinitions',
    'collections/DashboardInstances',
    'comms/Constants',
    'marketplace/AddWidgetContainer',
    'models/WidgetState',
    'events/EventBus',
    'services/GlobalKeyboardManager',
    'services/CommandManager',
    'services/FocusManager',
    'services/ToolbarButtonService',
    'services/WidgetComms',
    'services/TooltipsManager',
    'views/list/WidgetList',
    'views/toolbar/Toolbar',
    'views/DashboardContainer',
    'views/launchmenu/LaunchMenu',
    'views/dashboardswitcher/DashboardSwitcher',
    'views/dashboard/CreateDashboard',
    'views/dashboard/EditDashboard',
    'views/designer/Designer',
    'views/Modal',

    //libs
    'backbone',
    'jquery'
],
function (
    Router, ServerConfig, 
    PersonalWidgetDefinitions, DashboardInstances, 
    Constants, AddWidgetContainer, WidgetState, EventBus, 
    GlobalKeyboardManager, CommandManager, FocusManager, 
    ToolbarButtonService, WidgetComms,
    TooltipsManager,
    WidgetList, Toolbar, DashboardContainer, LaunchMenu, 
    DashboardSwitcher, CreateDashboard, EditDashboard,
    DashboardDesigner, Modal, Backbone, $
) {
    'use strict';

    // create a collection of dashboards from initial data
    var personalWidgetDefinitions = new PersonalWidgetDefinitions(ServerConfig.initialWidgetDefinitions, {
        parse: true,
        silent: true
    });

    //set the special 'all' pwd collection which represents all the pwds the current user has access too
    PersonalWidgetDefinitions.all = personalWidgetDefinitions;

    // Set useShims option for all Modal Views
    Modal.prototype.defaults.useShims = ServerConfig.useShims;

    TooltipsManager.init({
        useShims: ServerConfig.useShims
    });

    // create a collection of dashboards from initial data
    var dashboardInstances = new DashboardInstances();
    dashboardInstances.reset(ServerConfig.initialDashboards, {
        parse: true,
        silent: true
    });

    var toolbar = new Toolbar();
    toolbar.render();

    ToolbarButtonService.initialize({
        toolbar: toolbar,
        personalWidgetDefinitions: personalWidgetDefinitions
    });

    var dashboardContainer = new DashboardContainer({
        personalWidgetDefinitionsCollection: personalWidgetDefinitions,
        collection: dashboardInstances
    });
    EventBus.on('app:init', function () {
        dashboardContainer.render();
    });

    var router = new Router({ toolbar: toolbar });

    //setup widget eventing
    WidgetComms.init({
        dashboardContainer: dashboardContainer,
        dashboardInstances: dashboardInstances,
        personalWidgetDefinitions: personalWidgetDefinitions
    });

    // Trigger the initial route and enable HTML5 History API support, set the
    // root folder to '/' by default.  Change in app.js.
    Backbone.history.start();

    CommandManager.register('command:showLaunchMenu', function (evt) {
        if (!this.launchMenu) {
            this.launchMenu = new LaunchMenu({
                personalWidgetDefinitions: personalWidgetDefinitions
            });
            $(document.body).append(this.launchMenu.render().$el);
        }
        // Request to toggle launchMenu and return promise
        return this.launchMenu.toggleVisible();
    });

    CommandManager.register('application:logout', function () {
        window.location.href='logout';
    });

    CommandManager.register('dashboard:toggleSwitcher', function () {

        dashboardContainer.save();

        // Lazily create a dashboard switcher and add it to the document body.
        if (!this.dashboardSwitcher) {
            this.dashboardSwitcher = new DashboardSwitcher({
                dashboardInstances: dashboardInstances,
                dashboardContainer: dashboardContainer
            });
            $(document.body).append(this.dashboardSwitcher.render().$el);
        }

        // Request to toggle switcher and return promise
        return this.dashboardSwitcher.toggleVisible();
    });

    CommandManager.register('command:toggleMarketplaceSettings', function () {
        if (!this.marketplaceSettings) {
            this.marketplaceSettings = new WidgetList({
                collection: personalWidgetDefinitions,
                modelFilter: function(model) {
                    return (model.get("widgetType") === 'marketplace');
                }
            });
            $(document.body).append(this.marketplaceSettings.render().$el);
        }
        return this.marketplaceSettings.toggleVisible();
    });

    EventBus.on('dashboard:create', function () {
        var createDashboard = new CreateDashboard({
            removeOnClose: true,
            dashboards: dashboardInstances
        });

        createDashboard.show();

        var dashboardModel;
        createDashboard.create()
            .then(function(dashboard) {
                dashboardModel = dashboard;
                return createDashboard.hide();
            })
            .then(function () {
                var dashboardDesigner = new DashboardDesigner({
                    model: dashboardModel
                });

                dashboardDesigner.render();
                $('#main').append(dashboardDesigner.$el);
                dashboardDesigner.show();

                dashboardDesigner.design().then(function (config) {
                    dashboardDesigner.remove();
                    dashboardModel.setLayoutConfig(config);

                    //Pass dashboard model returned from async call
                    var activateEditedDashboard = function(model) {
                        dashboardContainer.activateDashboard(model, {rerender: true});
                    };

                    dashboardInstances.create(dashboardModel, {
                        success: activateEditedDashboard,
                        error: activateEditedDashboard
                    });
                });
            });
    });

    EventBus.on('dashboard:edit', function (id) {
        var dashboardModel = dashboardInstances.get(id);

        var editDashboard = new EditDashboard({
            removeOnClose: true,
            model: dashboardModel
        });

        editDashboard.show();

        editDashboard.edit()
            .then(function () {
                return editDashboard.hide();
            })
            .then(function () {
                editDashboard.remove();
                var me = this,
                    dashboardDesigner = new DashboardDesigner({
                        model: dashboardModel
                    });

                dashboardDesigner.render();
                $('#main').append(dashboardDesigner.$el);
                dashboardDesigner.show();

                dashboardDesigner.design().then(function (config) {
                    dashboardDesigner.remove();

                    dashboardModel.setLayoutConfig(config).save();

                    // activate edited dashboard
                    dashboardContainer.activateDashboard(dashboardModel, {rerender: true});
                });
            });
    });


    /*========== Global Keyboard Navigation  ==========*/
    var KeyNavKeys = Constants.KeyNav.Keys;

    GlobalKeyboardManager.on(KeyNavKeys.DASHBOARD_SWITCHER, function() {
        CommandManager.execute('dashboard:toggleSwitcher');
    });
    GlobalKeyboardManager.on(KeyNavKeys.ADMINISTRATION, function() {
        console.log('Toggle Administration');
    });
    GlobalKeyboardManager.on(KeyNavKeys.HELP, function() {
        console.log('Toggle Help');
    });
    GlobalKeyboardManager.on(KeyNavKeys.LAUNCH_MENU, function() {
        CommandManager.execute('command:showLaunchMenu');
    });
    GlobalKeyboardManager.on(KeyNavKeys.MARKETPLACE, function() {
        CommandManager.execute('command:toggleMarketplaceSettings');
    });
    GlobalKeyboardManager.on(KeyNavKeys.METRIC, function() {
        console.log('Toggle Metric Window');
    });
    GlobalKeyboardManager.on(KeyNavKeys.LOGOUT, function() {
        CommandManager.execute('application:logout');
    });
    GlobalKeyboardManager.on(KeyNavKeys.WIDET_SWITCHER, function() {
        console.log('Toggle Widget Switcher');
    });
    GlobalKeyboardManager.on(KeyNavKeys.SETTINGS, function() {
        console.log('Toggle Settings Window');
    });
    GlobalKeyboardManager.on(KeyNavKeys.CLOSE_WIDGET, function() {
        console.log('Closes Active Widget');
    });
    GlobalKeyboardManager.on(KeyNavKeys.ESCAPE_FOCUS, function() {
        toolbar.setFocused();
    });

    //enable adding a widget from mp
    var addWidgetContainer = new AddWidgetContainer();
    addWidgetContainer.initialize();

    return {
        router: router,
        dashboardContainer: dashboardContainer,
        personalWidgetDefinitionsCollection: personalWidgetDefinitions,
        DashboardInstancesCollection: DashboardInstances
    };
});
