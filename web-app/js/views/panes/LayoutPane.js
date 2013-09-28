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
    'views/panes/Pane',
    'mixins/CollectionView',
    'collections/WidgetStates',
    'collections/PersonalWidgetDefinitions',
    'backbone',
    'jquery',
    'lodash'
], function (Pane, CollectionView, WidgetStates, PersonalWidgetDefinitions, Backbone, $, _) {
    
    'use strict';

    //by mixing in CollectionView we get the renderCollection method.  However
    //it is up to subclasses to call that method with the appropriate arguments
    return Pane.extend(_.extend({}, CollectionView, {
        vtype: 'layoutpane',

        className: Pane.prototype.className + ' layoutpane',

        modelEvents: {
            'add': 'widgetAdded'
        },

        views: function () {
            return this.options.box;
        },

        _initCollection: function () {
            this.collection = new WidgetStates();
            this.collection.reset(this.options.widgets, {parse: true});
            this.collection.filterInaccessibles({
                modelDefaults: this.modelDefaults
            });
        },

        initialize: function () {
            this._initCollection();

            this.initializeCollectionView({
                $body: this.$renderCollectionBody || this.$el,
                collection: this.collection,
                viewFactory: this.viewFactory
            });
            this.collection.on('change:active', _.bind(this.changeActivation, this));

            Pane.prototype.initialize.apply(this, arguments);

            //if no widget is active, activate first widget
            if (this.collection.length && !this.collection.where({active: true}).length) {
                this.collection.at(0).set('active', true);
            }

            //initialize layoutConfig widgets
            this.options.widgets || (this.options.widgets = []);
        },

        //override this
        viewFactory: $.noop,

        render: function() {
            this.renderCollection();
            return Pane.prototype.render.apply(this, arguments);
        },


        afterRender: function () {
            this.$el.append( '<div class="paneshim hide"></div>' );

            this.doLayout();
        },

        // override this method if you need to do layout of widgets
        // when pane is resized 
        doLayout: $.noop,

        launchWidget: function(model, opts) {

            //set view specific defaults
            if (this.modelDefaults != null) {
                _.defaults(model.attributes, _.result(this,'modelDefaults'));
            }

            model.set('active',true);

            //add model to the paneView's collection
            // this will cause the widget to be rendered
            this.collection.add(model);

            //add model to the pane's layoutConfig
            this.options.widgets.push(model.toJSON());
        },

        changeActivation: function (widget) {
            var active = widget.get('active');

            if (active) {
                //deactivate all other widgets
                this.collection.each(function (widg) {
                    if (widget !== widg) {
                        widg.set('active', false);
                    }
                });
            }
        },

        widgetAdded: function(widget) {
            if (widget.get('active')) {
                this.changeActivation(widget);
            }
        },

        save: function () {
            //Don't override options.widgets if it exists, reuse it
            this.options.widgets.length = 0;
            for(var i = 0; i < this.collection.size(); i++) {
                this.options.widgets.push(this.collection.at(i).toJSON());
            }
        },

        remove: function() {
            if(this._doLayoutTimeout) {
                clearTimeout(this._doLayoutTimeout);
            }

            $(window).off('resize', this.onResize);

            Pane.prototype.remove.call(this);
        }
    }));
});
