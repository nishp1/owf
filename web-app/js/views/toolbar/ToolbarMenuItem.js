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
    'handlebars',
    'lodash',
    'views/View'
], function (Handlebars, _, View) {

    'use strict';
    
    var template =  Handlebars.compile(
                            '<a href="{{href}}" class="{{className}}">{{text}}</a>'
                    );
    
    var SPACE_KEYCODE = 32;

    return View.extend({
        
        vtype: 'toolbar-menu-item',
        
        className: 'toolbar-menu-item',

        href: '#',
        
        tagName: 'li',
        
        events: {
            'keydown' : 'onKeyDown'
        },
        
        initialize: function () {
             var me = this;
            _.extend(me, _.pick(me.options, 'text', 'href'));
            
            View.prototype.initialize.apply(this, arguments);
        },
        
        render: function () {
            this.$el.append(template(this));
            return this;
        },
        
        onKeyDown: function(evt) {
            if (evt.keyCode == SPACE_KEYCODE) {
                this.$el.trigger('click');
            }
        }
    });
    
});