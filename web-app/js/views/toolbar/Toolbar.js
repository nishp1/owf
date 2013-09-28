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
    'serverConfig',
    'services/CommandManager',
    'mixins/CircularFocus',
    'events/EventBus',
    'views/View',
    'views/toolbar/ToolbarButton',
    'views/toolbar/ToolbarSeparator',
    'views/toolbar/ToolbarMenu',
    'lodash',
    'jquery'
    
], function (ServerConfig, CommandManager, CircularFocus, EventBus, View, ToolbarButton, ToolbarSeparator, ToolbarMenu, _, $) {
       
    'use strict';   

    var tabFocusChangedToButtons = false;

    var Toolbar = View.extend(_.extend({}, CircularFocus, {
        
        el: $('#toolbar'),
        
        className: "navbar navbar-static-top",
        
        events: {
            'blur #toolbar-menu-list': 'onFocusLostFromMouseClick',
            'click #launch-menu-button': 'showLaunchMenu',
            'click #switcher-button': 'showSwitcherWindow',
            'click #settings-button': 'showSettingsWindow',
            'click #admin-button': 'showAdminWindow',
            'click #help-button': 'showHelpWindow'
        },
        
        views:[
            {
                vtype: 'toolbar-separator',
                vid: 'toolbar-separator-beginning',
                className: 'toolbar-separator',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-button',
                id: 'launch-menu-button',
                vid: 'launch-menu-button',
                iconClassName: 'launch-menu-button-icon',
                name: 'Launch Menu (Alt+Shift+L)',
                toolTip: 'This button opens or closes the Launch Menu, allowing users to add widgets to their current dashboard.',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-separator',
                vid: 'toolbar-separator-launch-menu-button',
                className: 'toolbar-separator',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-button',
                id: 'switcher-button',
                vid: 'switcher-button',
                iconClassName: 'switcher-button-icon',
                name: 'Switcher (Alt+Shift+C)',
                toolTip: 'This button opens or closes the Switcher, allowing users to switch between their dashboards.',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-separator',
                vid: 'toolbar-separator-switcher-button',
                className: 'toolbar-separator',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-button',
                id: 'settings-button',
                vid: 'settings-button',
                iconClassName: 'settings-button-icon',
                name: 'Settings (Alt+Shift+S)',
                toolTip: 'This button opens the Settings window, allowing users to customize their widgets or change themes.',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-separator',
                vid: 'toolbar-separator-settings-button',
                className: 'toolbar-separator',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-button',
                id: 'admin-button',
                vid: 'admin-button',
                iconClassName: 'admin-button-icon',
                name: 'Administration (Alt+Shift+A)',
                toolTip: 'This button opens the Administration window, exposing administrators to functionality for managing groups, dashboards, widgets, and users.',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-separator',
                vid: 'toolbar-separator-admin-button',
                className: 'toolbar-separator',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-button',
                id: 'help-button',
                vid: 'help-button',
                iconClassName: 'help-button-icon',
                name: 'Help (Alt+Shift+H)',
                toolTip: 'This button opens the Help window, allowing users to browse help files for assistance on using OWF.',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-separator',
                vid: 'toolbar-separator-help-button',
                className: 'toolbar-separator',
                renderTo: '#toolbar-item-list'
            },
            {
                vtype: 'toolbar-menu',
                id: 'toolbar-menu',
                vid: 'toolbar-menu',
                renderTo: '#toolbar-navbar'
            }
        ],
        
        render: function (){
            this.$el.append(
                '<div id="toolbar-navbar" class="navbar-inner">' +
                '    <ul id="toolbar-item-list" class="nav"></ul>' +
                '</div>'
            );
            View.prototype.render.apply(this,arguments);
            
            this.initCircularFocus($('#launch-menu-button > a'), $('#help-button > a'), this.changeFocusToMenu, this.changeFocusToMenu);
            
            return this;
        },
        
        changeFocusToMenu: function() {
            var $menu = $('#toolbar-menu-list');
            $menu.removeClass('fade-out');
            $('#toolbar-menu').addClass('open');
            $menu.addClass('fade-in-now');

            if(ServerConfig.useShims) {
                $menu.bgiframe();
            }

            this.reinitCircularFocus($('.toolbar-menu-item-profile > a'), $('.toolbar-menu-item-sign-out > a'), this.changeFocusToButtons, this.changeFocusToButtons);
        },
        
        changeFocusToButtons: function() {
            this.tabFocusChangedToButtons = true;
            $('#toolbar-menu').removeClass('open fade-in-now');
            $('#toolbar-menu-list').addClass('fade-out');
            this.reinitCircularFocus($('#launch-menu-button > a'), $('#help-button > a'), this.changeFocusToMenu, this.changeFocusToMenu);
        },
        
        onFocusLostFromMouseClick: function()
        {
            var me = this;
            setTimeout(function()
            {
                var target = document.activeElement;
                var foundItemInMenu = $('#toolbar-menu-list').find(target);
                if ((foundItemInMenu == null || foundItemInMenu.length === 0) && !me.tabFocusChangedToButtons) {
                  
                    me.reinitCircularFocus($('#launch-menu-button > a'), $('#help-button > a'), me.changeFocusToMenu, me.changeFocusToMenu);

                    var menu = $('#toolbar-menu');
                    menu.removeClass('open');

                    var menuList = $('#toolbar-menu-list');    
                    menuList.removeClass('fade-in fade-in-now');
                    menuList.addClass('fade-out');
                }
                
                me.tabFocusChangedToButtons = false;
            }, 100);
        },

        addMarketplaceButton: function (cfg) {
            var index = 0, config;

            cfg = cfg || {};
            config = _.extend({
                vtype: 'toolbar-button',
                id: 'marketplace-button',
                vid: 'marketplace-button',
                iconClassName: 'marketplace-button-icon',
                name: 'Marketplace (Alt+Shift+M)',
                toolTip: 'This button opens the Marketplace window, allowing users to discover widgets in Marketplace and add them to their OWF instance.',
                renderTo: '#toolbar-item-list'
            }, cfg);

            // loop through the views
            for (var a = 0; a < this.views.length; a++) {
                if (this.views[a].vid === 'switcher-button') {

                    // since the function takes the "button" index and we have the "real"
                    // index, we have to calculate the button index to pass into the function
                    index = (a + 1) / 2;
                    a = this.views.length;
                }
            }

            return this.insertItemAt(config, index);
        },

        addMetricsButton: function(cfg) {
            var index = 0, config;

            cfg = cfg || {};
            config = _.extend({
                vtype: 'toolbar-button',
                id: 'metrics-button',
                vid: 'metrics-button',
                iconClassName: 'metrics-button-icon',
                name: 'Metrics (Alt+Shift+R)',
                toolTip: 'This button opens the Metric window, where widgets that monitor OWF and widget statistics are located.',
                renderTo: '#toolbar-item-list'
            },cfg);
                
            // loop through the views
           for (var a = 0; a < this.views.length; a++) {
                if (this.views[a].vid === 'settings-button') {
                    
                    // since the function takes the "button" index and we have the "real"
                    // index, we have to calculate the button index to pass into the function
                    index = (a - 1)/2;
                    a = this.views.length;
                }
           }

            return this.insertItemAt(config, index);
        },
        
        showLaunchMenu: function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            CommandManager.execute('command:showLaunchMenu', evt);
            return false;
        },

        showSwitcherWindow: function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            CommandManager.execute('dashboard:toggleSwitcher');
            return false;
        },

        showSettingsWindow: function() {
            return false;
        },

        showAdminWindow: function () {
            return false;
        },

        showHelpWindow: function () {
            return false;
        },
        
        setFocused: function() {
            $('#toolbar-navbar > ul > li > a ').trigger('blur');
            $('#toolbar-navbar > div > ul > li > a ').trigger('blur');
            $('#launch-menu-button > a').focus();
            this.reinitCircularFocus($('#launch-menu-button > a'), $('#help-button > a'), this.changeFocusToMenu, this.changeFocusToMenu);
        },
            
        /*
         * 
         * This is the beginning of the API code
         * 
         */
        
        /**
        * Adds an item to the toolbar, before the help button.
        * It also adds a separator between the element and the help button.
        * @param config.vtype The vtype of the item that is being added.
        * @param config.id The id of the DOM that will be added.
        * @param config.vid The internal id of this object and will never be
        *        rendered to the screen. This is a required field.
        * @param config.name The name of the component to be added. If the
        *        vtype is toolbar-button, this is appended to the tooltip.
        * @param config.iconClassName If vtype is toolbar-button, this class
        *        will be the class that has the button image.
        * @param config.el The DOM element to be added to the toolbar.
        * @param config.toolTip If the vtype is toolbar-button, this is the
        *        tooltip that will display when hovering over the button.
        *        
        * @return The DOM element that has been added.
        */
        addItem: function (config) {
            
            var index = 0;
                
            // if vid is null, return null
            if (config.vid == null) {
                return null;
            }
                
            // loop through the children to find the index of the help button
            for (var a = 0; a < this.views.length; a++) {
                if (this.views[a].vid === 'help-button') {
                    
                // since the function takes the "button" index and we have the "real"
                // index, we have to calculate the button index to pass into the function
                    index = (a - 1)/2;
                }
            }

            return this.insertItemAt(config, index);
        },
        
        /**
        * Inserts an item into the toolbar at the index position. It is a
        * 0 based index starting with the Launch Menu Button at index 0.
        * 
        * The function will first look for a vtype.  If it finds a vtype it will
        * check for a valid vtype.  If it does not find a valid vtype it will
        * return null. 
        * 
        * If the function does not have a vtype it will then look for the el
        * parameters.  If the el parameter is found it will insert it inside of
        * the <li> tags that make up the items along the toolbar.
        * 
        * @param config.vtype The vtype of the item that is being added.
        * @param config.id The id of the DOM that will be added.
        * @param config.vid The internal id of this object and will never be
        *        rendered to the screen. This is a required field.
        * @param config.name The name of the component to be added. If the
        *        vtype is toolbar-button, this is appended to the tooltip.
        * @param config.iconClassName If vtype is toolbar-button, this class
        *        will be the class that has the button image.
        * @param config.el The DOM element to be added to the toolbar.
        * @param config.toolTip If the vtype is toolbar-button, this is the
        *        tooltip that will display when hovering over the button.
        * @param index The 0-based index where the item is to be inserted.
        * 
        * @return The DOM element that has been inserted. The function will 
        *        return null if the index is out of bounds.
        */
        insertItemAt: function(config, index) {
            
            var realIndex = index * 2, // must calculate this due to separators    
                listItem = $('<li />'),
                itemToInsert = null,
                separator;
                
            // if vid is null, return null
            if (config.vid == null) {
                return null;
            }
            
            try {
                
                // if the index is not in the bounds, then exit
                if (index < 0 || index > Math.floor(this.views.length / 2)) {
                    return null;
                }
                
                // if the index is in bounds and the config is not null, try to insert object
                if (config !== null) {
                    
                    config.renderTo = '#toolbar-item-list';
                    
                    // if the vtype has been set go this route
                    if (config.vtype != null) {
                        
                        // right now we're only supporting toolbar-buttons
                        if (config.vtype === 'toolbar-button') {
                            itemToInsert = this.addView(config, realIndex + 1);
                        }
                    }
                    // if no vtype, then check if the el parameter is in there
                    else if (config.el != null) {
                        listItem.append(config.el);
                        config.el = listItem;
                        config.vtype = 'toolbar-user-added-item';
                        var view = new View(config);
                        view.vid = config.vid;
                        itemToInsert = this.addView(view, realIndex + 1);
                    }
                        
                    // if the object to insert is not null, insert it into the DOM
                    if (itemToInsert != null) {
                       
                        // add the new item to the dom
                        var $toolbarItemList = $('#toolbar-item-list');
                        var $itemToInsertAfter = $toolbarItemList.children().eq(realIndex);
                        itemToInsert.$el.insertAfter($itemToInsertAfter);
                        itemToInsert = itemToInsert.el;

                        // add the toolbar separator
                        var toolbarConfig  = {
                            vtype: 'toolbar-separator',
                            vid: 'toolbar-separator-' + config.vid
                        };
                        separator = this.addView(toolbarConfig, realIndex + 2);
                        separator.$el.insertAfter(itemToInsert);
                    }
                    
                }
            }
            
            // if it fails for any reason set the return value to null
            catch (e) {
                itemToInsert = null;
            }
            
            return itemToInsert;
        },
        
        /**
        * Removes the item with the vid passed in.
        * 
        * @param vid The vid of the item that you want to remove.
        * 
        * @return True if the element was found and removed, false otherwise.
        */
        removeItem: function(vid) {
            
            var viewRemoved = false,
                viewToRemove = this.getView(vid),
                separatorToRemove = this.getView('toolbar-separator-' + vid);
                
                
            if (viewToRemove != null && separatorToRemove != null) {
                this.removeView(viewToRemove);
                this.removeView(separatorToRemove);
                viewRemoved = true;
            }
            
            return viewRemoved;
        },

        findView: function(vid) {
            return _.find(this.views,function(view) {
              return view.vid === vid;
            });
        }
   
    }));
    
    return Toolbar;

});
