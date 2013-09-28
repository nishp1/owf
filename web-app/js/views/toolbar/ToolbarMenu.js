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
    'handlebars',
    'jquery',
    'lodash',
    'views/View',
    'views/toolbar/ToolbarMenuItem',
    'views/components/Divider',
    'services/CommandManager'
], function (ServerConfig, Handlebars, $, _, View, ToolbarMenuItem, Divider, CommandManager) {

    'use strict';
    
    var htmlTemplate =  '<a class="dropdown-toggle toolbar-menu-button" data-toggle="dropdown" unSelectable="on">' +
                        '<span class="toolbar-menu-button-text" unSelectable="on">Test Admin 1</span>' +
                        '<i class="toolbar-menu-button-icon" unSelectable="on">&nbsp;</i>' +
                        '</a>' +
                        '<ul id="toolbar-menu-list" class="dropdown-menu fade-out">' +
                        '</ul>';
                    
    return View.extend({
        
        vtype: 'toolbar-menu',
        
        className: 'dropdown',
        
        id: 'toolbar-menu',
        
        tagName: 'div',
        
        views: 
        [
            {
                vtype: 'toolbar-menu-item',
                className: 'toolbar-menu-item-previous-sign-in',
                text: 'Previous Signed in',
                renderTo: '#toolbar-menu-list'
            },
            {
                vtype: 'toolbar-menu-item',
                className: 'toolbar-menu-item-profile',
                text: 'Profile',
                renderTo: '#toolbar-menu-list'
            },
            {
                vtype: 'toolbar-menu-item',
                className: 'toolbar-menu-item-about',
                text: 'About',
                renderTo: '#toolbar-menu-list'
            },
            {
                vtype: 'divider',
                renderTo: '#toolbar-menu-list'
            },
            {
                vtype: 'toolbar-menu-item',
                className: 'toolbar-menu-item-sign-out',
                text: 'Sign Out',
                href: 'logout',
                renderTo: '#toolbar-menu-list'
            }
        ],
        
        events: {
            'mousedown .toolbar-menu-button' : 'onToolbarMenuButtonMouseDown',
            'mouseup .toolbar-menu-button' : 'onToolbarMenuButtonMouseUp',
            'mouseenter .toolbar-menu-button' : 'onToolbarMenuButtonMouseOver',
            'mouseleave .toolbar-menu-button' : 'onToolbarMenuButtonMouseOut',
            'mouseenter .dropdown-menu' : 'onToolbarMenuMouseOver',
            'mouseleave .dropdown-menu' : 'onToolbarMenuMouseOut',
            'click .toolbar-menu-item-sign-out' : 'onSignOut'
        },
        
        initialize: function () {
            
            var me = this;
            _.extend(me, _.pick(me.options, 'vid'));
            
            View.prototype.initialize.apply(this, arguments);
        },
        
        render: function () {
            this.$el.append(htmlTemplate);
            View.prototype.render.apply(this,arguments);
        },
            
        onToolbarMenuMouseOver: function(evt) {
            
            this.$el.addClass('open');
            var $menu = $('#toolbar-menu-list');
            $menu.addClass('fade-in');
            $menu.removeClass('fade-out');

            if(ServerConfig.useShims) {
                $menu.bgiframe();
            }
            
            this.$el.trigger('blur');

        },
        
        onToolbarMenuMouseOut: function(evt) {
            
            this.$el.removeClass('open');
            var menu = $('#toolbar-menu-list');
            menu.addClass('fade-out');
            menu.removeClass('fade-in fade-in-now');

        },
        
        onToolbarMenuButtonMouseDown: function(evt)  {
            
            var menu = $('#toolbar-menu-list');    
            
            if (menu.css('visibility') === 'visible' && Number(menu.css('opacity')) > 0.5){
                this.onToolbarMenuMouseOut(evt);
            }
            else {   
                menu.removeClass('fade-out fade-in');      
                this.$el.trigger('blur');
                
                menu.addClass('fade-in-now');
                this.$el.trigger('blur');
            }
            
            this.$el.addClass('mouse-down');
        },
        
        onToolbarMenuButtonMouseUp: function(evt) {
            this.$el.removeClass('mouse-down');
        },
        
        onToolbarMenuButtonMouseOver: function(evt) {
            this.onToolbarMenuMouseOver(evt);
        },
        
        onToolbarMenuButtonMouseOut: function(evt) {
            this.onToolbarMenuMouseOut(evt);
        },
        
        onSignOut: function(evt) {
            CommandManager.execute('application:logout');
        }

    });
    
});