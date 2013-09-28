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
    'lodash',
    'backbone'
],

function( $, _, Backbone ) {

    'use strict'; 

    var INCREMENT_BY = 10000,
        INDEX_GAP = 4,
        ZBASE = INCREMENT_BY,
        IDSTR = '_zIndexManager-id',
        ACTIVATED = 'activate',
        DEACTIVATED = 'deactivate',
        $doc = $(document);

    var ZIndexModel = Backbone.Model.extend({
        defaults: {
            view: null,
            logicalIndex: 0
        },

        //derive the model id from the views
        //cid
        parse: function(attrs) {
            return _.extend({
                id: attrs.view.cid
            }, attrs);
        }
    });

    var ZIndexCollection = Backbone.Collection.extend({
        model: ZIndexModel,
        comparator: 'logicalIndex'
    });

    function ZIndexManager() {

        var me = this;
        
        this.zBase = ZBASE;
        this.front = null;
        this._className = 'z-index-managed-' + this.zBase;

        this.views = new ZIndexCollection();

        this.views.on({
            'change:logicalIndex': function(model) {
                me.views.sort();
                me.compactIndicies();
                me.views.each(me.refreshZIndex, me);
            }
        });

        ZBASE += INCREMENT_BY;
    }

    _.extend(ZIndexManager.prototype, Backbone.Events, {

        //adjust the view's css z-index based on its logicalIndex
        refreshZIndex: function(model) {
            model.get('view').$el.css('z-index', this.zBase + model.get('logicalIndex') * 
                INDEX_GAP);
        },

        //set each model's logicalIndex to its index in the collection.
        //Since the collection is sorted on logicalIndex, this should not
        //change relative ordering
        compactIndicies: function() {
            this.views.each(function(model, index) {
                model.set('logicalIndex', index, {silent: true});
            });
        },

        /**
         * @param view the view to register
         * @param logicalIndex a logical, initial z-index for this view, relative
         * to the logicalIndexes of the other views.  This value is retrievable
         * using getLogicalIndex, and is subject to change whenever bringToFront
         * is called.  Default value: 0.  
         */
        register: function(view, logicalIndex) {
            var me = this,
                model = new ZIndexModel({view: view, logicalIndex: logicalIndex}, {parse: true});

            this.listenTo(view, 'remove', _.bind(this.unregister, this));

            this.views.add(model);

            this.refreshZIndex(model);
        },

        unregister: function(view, options) {
            this.views.remove(view.cid);
            this.stopListening(view);
        },

        getLogicalIndex: function (view) {
            return this.views.get(view.cid).get('logicalIndex');
        },

        bringToFront: function(view) {
            var logicalIndex;

            //determine highest existing logicalIndex and give this view one higher
            logicalIndex = this.views.max(function(model) {
                return model.get('logicalIndex');
            }).get('logicalIndex') + 1;

            this.views.get(view.cid).set('logicalIndex', logicalIndex);
        },

        destroy: function() {
            var me = this;

            //do not change z-indexes as we unregister
            this.views.off();

            _.each(this.views.toJSON(), function(model) {
               me.unregister(model.view); 
            });
        }
    });

    return ZIndexManager;
});
