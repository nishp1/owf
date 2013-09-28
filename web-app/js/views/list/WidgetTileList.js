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
    'models/WidgetState',
    'views/list/List',
    'views/list/WidgetTile',
    'mixins/containers/SortableCollectionView',
    'util/containerUtil',
    // Libraries.
    'jquery',
    'lodash'
], function (WidgetState, List, WidgetTile, SortableCollectionView, ContainerUtil, $, _) {
    'use strict';

    return List.extend(_.extend({}, SortableCollectionView, {
        vtype: 'widgetTileList',
        className: 'tilesview',
        tabIndex: '-1',

        listItemView: WidgetTile,

        events: _.extend({}, List.prototype.events, {
            //todo this is a click for now until the launch btn is implemented
            'click > .widgetTile': 'onWidgetDblClick'
        }),

        render: function () {
            List.prototype.render.call(this);

            this.initSortable({
                handle: ".thumb",
                cursor: 'pointer',
                tolerance: 'pointer'
            });

            return this;
        },

        onWidgetDblClick: function (evt) {
            var currentTarget = $(evt.currentTarget),
                view = currentTarget.data('view'),
                cloned = view.model.clone(),
                widgetStateModel = null;

            //create a new id
            cloned.id = ContainerUtil.guid();
            cloned.set('id', cloned.id);

            //create a new wigetstatemodel
            widgetStateModel = WidgetState.createFromPersonalWidgetDefinition(cloned);


            this.trigger('launchMenu:launchWidgetStart', widgetStateModel, {
                byDragDrop: false
            });
        }
    }));

});
