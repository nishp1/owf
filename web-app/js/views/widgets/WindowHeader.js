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
    'views/widgets/Header',
    'handlebars',
    'lodash'
], function(Header, Handlebars, _) {
    'use strict';

    var btnTpl = 
        '<li class="minimize">' +
            '<a title="Minimize" class="minimize-btn">' +
                '<i class="icon-minus"></i>' +
            '</a>' +
        '</li>' +
        '<li class="restore">' +
            '<a title="Restore" class="restore-btn">' +
                '<i class="icon-resize-small"></i>' +
            '</a>' +
        '</li>' +
        '<li class="maximize">' +
            '<a title="Maximize" class="maximize-btn">' +
                '<i class="icon-resize-full"></i>' +
            '</a>' +
        '</li>';

    return Header.extend({
        events: _.extend({
            'click .minimize-btn' : 'minimize',
            'click .maximize-btn' : 'maximize',
            'click .restore-btn' : 'restore'
        }, Header.prototype.events),

        btnTemplate: btnTpl,

        render: function() {
            var me = this;
            
            Header.prototype.render.call(me);

            // When header is dblclicked, maximize or restore
            me.$el.dblclick(function() {
                me.model.get('maximized') ? me.restore() : me.maximize();
            });

            return this;
        },

        minimize: function() {
            this.model.set({
                minimized: true,
                maximized: false
            });
        },

        restore: function() {
            this.model.set({
                minimized: false,
                maximized: false
            });
        },

        maximize: function() {
            this.model.set({
                minimized: false,
                maximized: true
            });
        }

    });
});
