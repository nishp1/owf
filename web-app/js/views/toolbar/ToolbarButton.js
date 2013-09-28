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
    'jquery',
    'handlebars',
    'lodash',
    'views/components/Button'
], function ($, Handlebars, _, Button) {

    'use strict';

    var buttonHtmlTemplate = '<a href="#" class="<%= iconClassName %>"/>';
    
    var mouseX = -1,
        mouseY = -1;

    return Button.extend({
        
        vtype: 'toolbar-button',
        
        className: 'toolbar-button',
        
        tagName: 'li',
        
        events: {
            'tooltipshown' : 'onToolTipShown',
            'mousemove' : 'calculateCursorPosition'
        },

        keynavEvents: {
            'keydown(space)' : 'onKeyDown'
        },
        
        template: _.template(buttonHtmlTemplate),
        
        initialize: function () {

            var me = this;
            _.extend(me, _.pick(me.options, 'iconClassName', 'vid', 'name', 'toolTip'));
            me.iconClassName = 'toolbar-button-icon ' + me.iconClassName;
            
            // handle the tooltip
            this.$el.tooltip({
                animation: false,
                title: '<b>' + me.name + '</b><br><br>' + me.toolTip,
                html: true,
                delay: { show: 1000, hide: 0 }
            });

            Button.prototype.initialize.apply(this, arguments);
        },

        render: function() {
            this.$el.append(this.template(this));
            return this;
        },
        
        onToolTipShown: function(evt) {
            $('.tooltip').css({ top: mouseY + 15, left: mouseX + 15 });
        },
        
        // this is used to position the tool tip dynamically based on the cursor position.
        calculateCursorPosition: function(evt) {
            mouseX = evt.pageX;
            mouseY = evt.pageY;
        },
        
        onKeyDown: function(evt) {
            this.$el.trigger('click');
        }

    });
    
});