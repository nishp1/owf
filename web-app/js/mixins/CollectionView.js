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

/**
 * A mixin for views that are bound to a particular collection.
 * Automatically adds and removes views when they are added and removed
 * from the collection
 */
define([
    'lodash'
], function (_) {
    'use strict';

    return {

        initializeCollectionView: function (options) {
            var me = this;

            this._collectionViewOpts = this._collectionViewOpts || {};
            this.itemViewMap = {};

            //copy options
             _.extend(this._collectionViewOpts, options);

            var collection = this._collectionViewOpts.collection;

            //when a model is added to the collection, add a view
            this.listenTo(collection, 'add', _.bind(this.renderItem, this));

            //when a model is removed from the collection, remove the view
            this.listenTo(collection, 'remove', _.bind(this.removeItem, this));

            // remove each item view when view is removed
            this.once('remove', function () {
                _.invoke(_.values(me.itemViewMap), 'remove');
            });
        },

        getItemViewMap: function() {
          return this.itemViewMap;
        },

        renderCollection: function (options) {
            if (options != null) {
              this.initializeCollectionView(options);
            }

            //render initial collection contents
            this._collectionViewOpts.collection.each(this.renderItem, this);
        },

        renderItem: function (widget) {
            var $body = this._collectionViewOpts.$body;
            var viewFactory = this._collectionViewOpts.viewFactory;
            var view = viewFactory.call(this,widget);

            if (view) {
                $body.append(view.render().$el);
                this.itemViewMap[widget.cid] = view;
            }
        },

        removeItem: function (widget) {
            var view = this.itemViewMap[widget.cid];
            if (view) {
                view.remove();
                delete this.itemViewMap[widget.cid];
            }
        }
        
    };
});
