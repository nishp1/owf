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
    'views/View',
    'views/list/List',
    'collections/Collection',
    'lodash',
    'handlebars',
    'bootstrap/bootstrap-tooltip'
], function (View, List, Collection, _, Handlebars) {

    'use strict';

    /*==========  Collections  ==========*/
    
    var boxTypes = new Collection([
        {
            ruleType: 'vertical',
            title: 'Vertical Divider',
            image: 'themes/common/images/dashboard-designer/hbox.png'
        }, {
            ruleType: 'horizontal',
            title: 'Horizontal Divider',
            image: 'themes/common/images/dashboard-designer/vbox.png'
        }
    ]);

    var layoutPaneTypes = new Collection([
        {
            paneType:'accordionpane',
            name: 'Accordion',
            image: 'themes/common/images/dashboard-designer/accordion.png'
        },
        {
            paneType:'desktoppane',
            name: 'Desktop',
            image: 'themes/common/images/dashboard-designer/desktop.png'
        },
        {
            paneType:'portalpane',
            name: 'Portal',
            image: 'themes/common/images/dashboard-designer/portal.png'
        },
        {
            paneType:'tabbedpane',
            name: 'Tabbed',
            image: 'themes/common/images/dashboard-designer/tabbed.png'
        },
        {
            paneType:'fitpane',
            name: 'Fit',
            image: 'themes/common/images/dashboard-designer/fit.png'
        }
    ]);

    /*==========  Item Views  ==========*/
    
    var BoxTypesView = View.extend({
        
        tagName: 'li',

        className: 'ruletype',

        attributes: function () {
            return {
                'rel': 'tooltip',
                'title': this.model.get('title'),
                'tabindex': '0',
                'data-ruletype': this.model.get('ruleType')
            };
        },

        render: function () {
            View.prototype.render.call(this);
            this.$el.append('<img src="' + this.model.get('image') + '"></img>');
            return this;
        }

    });

    var LayoutPaneTypesView = View.extend({
        
        tagName: 'li',

        className: 'panetype',

        attributes: function () {
            return {
                'rel': 'tooltip',
                'title': this.model.get('name'),
                'tabindex': '0',
                'data-panetype': this.model.get('paneType')
            };
        },

        render: function () {
            View.prototype.render.call(this);
            this.$el.append('<img src="' + this.model.get('image') + '"></img>');
            return this;
        }

    });


    /*==========  Main View  ==========*/
    
    return View.extend({

        className: 'side-panel',

        render: function () {
            View.prototype.render.call(this);

            this._dividerList = new List({
                tagName: 'ul',
                className: 'unstyled',
                collection: boxTypes,
                listItemView: BoxTypesView
            });

            this._layoutTypesList = new List({
                tagName: 'ul',
                className: 'unstyled',
                collection: layoutPaneTypes,
                listItemView: LayoutPaneTypesView
            });

            this.$el
                .append( this._dividerList.render().el )
                .append( this._layoutTypesList.render().el );

            return this;
        },

        remove: function () {
            this._dividerList.remove();
            this._layoutTypesList.remove();
            
            View.prototype.remove.call(this);
        }

    });

});
