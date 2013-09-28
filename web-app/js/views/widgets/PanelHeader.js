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
        '<li class="collapse">' +
            '<a title="Collapse" class="collapse-btn">' +
                '<i class="icon-double-angle-up"></i>' +
            '</a>' +
        '</li>' +
        '<li class="expand">' +
            '<a title="Expand" class="expand-btn">' +
                '<i class="icon-double-angle-down"></i>' +
            '</a>' +
        '</li>';

    return Header.extend({

        events: _.extend({}, Header.prototype.events, {
            'click .collapse-btn' : 'collapse',
            'click .expand-btn' : 'expand'
        }),

        btnTemplate: btnTpl,

        render: function() {
            var me = this;
            
            Header.prototype.render.call(me);

            // When header is dblclicked, collapse or expand
            me.$el.dblclick(function() {
                me.model.get('collapsed') ? me.expand() : me.collapse();
            });

            return this;
        },

        createTemplateModel: function() {
            var templateModel = Header.prototype.createTemplateModel.apply(this, arguments);

            templateModel.restorable = templateModel.maximizable || templateModel.minimizable;

            return templateModel;
        },

        collapse: function() {
            this.model.set('collapsed', true);
        },

        expand: function() {
            this.model.set('collapsed', false);
        }
    });
});
