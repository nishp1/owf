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
    'events/EventBus',
    'views/View',
    './StackDashboards',
    'views/list/List',
    'views/dashboardswitcher/Tile',
    'mixins/containers/SortableCollectionView',
    // Libraries.
    'jquery',
    'lodash',
    'handlebars'
],

function(EventBus, View, StackDashboards, List, Tile, SortableCollectionView, $, _, Handlebars) {

    function getDashboardModel(evt) {
        return $(evt.currentTarget).parents('.dashboard').data('view').model.get('switcherItem');
    }

    function getStackModel (evt) {
        return $(evt.currentTarget).parents('.stack').data('view').model.get('switcherItem');
    }

    var Tiles = List.extend(_.extend({}, SortableCollectionView, {

        vtype: 'dashboardswitcher.tiles',

        listItemView: Tile,

        className: 'tilesview',

        tabIndex: '-1',

        // stack model if a stack is expanded
        openStackModel: null,

        // stack item view if a stack is expanded
        openStackView: null,

        // view for stack dashboards if a stack is expanded
        stackDashboards: null,

        modelEvents: _.extend({}, List.prototype.modelEvents, {
            'remove': 'removeOne',
            'destroy': 'removeOne'
        }),

        events: _.extend({}, List.prototype.events, {
            'click > .dashboard': 'onDashboardClick',
            'click .dashboard .share': 'shareDashboard',
            'click .dashboard .refresh': 'restoreDashboard',
            'click .dashboard .edit': 'editDashboard',
            'click .dashboard .remove': 'deleteDashboard',
            'mouseenter > .dashboard': 'showActions',
            'mouseleave > .dashboard': 'hideActions',
            'focusin > .dashboard': 'showActions',

            'click > .stack': 'toggleStack',
            'click .stack .refresh': 'restoreStack',
            'click .stack .remove': 'deleteStack',
            'mouseenter > .stack': 'showActions',
            'mouseleave > .stack': 'hideActions',
            'focusin > .stack': 'showActions',

            'sortstart': 'onSortStart',
            'sortstop': 'onSortStop'
        }),

        keynavEvents: _.extend({}, List.prototype.keynavEvents, {
            /* IE7 Fix
             * The following two key-events are tied to 'keydown' instead of the OWF convention 
             * 'keyup'. This fixes a bug that is most prevalent in IE7 and does so without affecting 
             * user expectations.
             * The bug occurs when launching the dashboard switcher by pressing 'space' on the switcher 
             * button in the toolbar. The keydown on the button launches the switcher (normal browser 
             * behavior); once the switcher is open, the switcher changes focus to a tile. In some cases, 
             * the 'keyup' event which follows the 'keydown' targets the tile instead of the switcher 
             * toolbar button causing the switcher to perform the tile's action (e.g. open dashboard). 
             * This may be prevented by tying the tile's action to 'keydown' instead. Since keydown 
             * may repeat, if the user opens the switcher with the spacebar on the toolbar button and 
             * keeps the spacebar depressed, the keydown will eventually fire on the tile. This behavior 
             * also exists in OWF 7 when using holding the enter key on the dashboard switcher toolbar 
             * button
             */
            'keydown(space) > .dashboard': 'onDashboardClick',
            'keydown(space) > .stack': 'toggleStack',
            'keyup(space) .dashboard .share': 'shareDashboard',
            'keyup(space) .dashboard .refresh': 'restoreDashboard',
            'keyup(space) .dashboard .edit': 'editDashboard',
            'keyup(space) .dashboard .remove': 'deleteDashboard',
            'keyup(space) .stack .refresh': 'restoreStack',
            'keyup(space) .stack .remove': 'deleteStack',
            'keyup([) .dashboard , .stack': 'shiftTileLeft',
            'keyup(]) .dashboard , .stack': 'shiftTileRight'
        }),

        initialize: function() {
            List.prototype.initialize.call(this);
            this._managing = false;
        },

        render: function () {
            List.prototype.render.call(this);

            this.initSortable({
                handle: ".thumb",
                cursor: 'move',
                tolerance: 'pointer'
            });

            return this;
        },

        shiftTileLeft: function(evt) {
            var $target = $(evt.currentTarget),
                $previousTile = $target.prev('.dashboard , .stack'),
                tile = $target.data('view').model;
            this.collection.bumpLeft(tile, {silent: true});

            // Move the tile view directly with the DOM for performance reasons.
            // The idea is to avoid re-rendering the whole switcher. 
            // IE7 has performance issues as is
            if($previousTile.length > 0) {
                // If we have open stack dashboards, close them prior to repositioning.
                this.closeStack();
                // Put the next tile before this one
                // Although this code is not as intuitive as putting the this after the next tile, 
                // it avoids removing the current tile from the DOM and losing focus
                $target.after($previousTile);
                this.trigger('tiles:rearrange');
            }
        },

        shiftTileRight: function(evt) {
            var $target = $(evt.currentTarget),
                $nextTile = $target.next('.dashboard , .stack'),
                tile = $target.data('view').model;
            this.collection.bumpRight(tile, {silent: true});

            if($nextTile.length > 0) {
                // If we have open stack dashboards, close them prior to repositioning.
                this.closeStack();
                $target.before($nextTile);
                this.trigger('tiles:rearrange');
            }
        },

        onSortStart: function(evt) {
            // If we have open stack dashboards, close them prior to repositioning.
            if (this.openStackModel) {
                this.stackDashboards.hide();
            }
        },

        onSortStop: function(evt) {
            // If we had an open stack dashboard after repositioning dashboards, reopen the view.
            if (this.openStackModel) {
                this.positionSubTiles(this.openStackView, this.stackDashboards);
                this.stackDashboards.remove();
            }
            this.trigger('tiles:rearrange');
        },

        removeOne: function(item) {
            var stackDashboards = this.stackDashboards;
            if (item.get('isStack')) {
                // Check to see if we need to remove our sub tiles.
                if (this.openStackModel && (item.get('id') === this.openStackModel.get('id'))) {
                    this.stackDashboards.hide().then(function() {
                        stackDashboards.remove();
                    });
                    this.openStackModel = null;
                    this.openStackView = null;
                    this.stackDashboards = null;
                }
            }
        },

        addOne: function (item) {
            if( this.stackDashboards ) {
                var $items = this.$el.children('.dashboard, .stack'),
                    total = $items.length,
                    itemsInRow = parseInt(this.$el.outerWidth(true) / $('>:first-child', this.$el).outerWidth(true), 10);

                if( (total % itemsInRow) !== 0 ) {
                    // add it after last item in row
                    $($items[ total - 1 ]).after( this.createOne(item).el );
                }
                else {
                    List.prototype.addOne.call(this, item);
                }
            }
            else {
                List.prototype.addOne.call(this, item);
            }
        },

        select: function (dashboard, stack) {
            var me = this,
                el = null,
                stackView = null,
                dashboardView = null;

            // If we have a stack, close any open stacks and open the new one. 
            if (stack) {
                // Get the view for the stack.
                el = _.filter(this.$('.stack'), function(viewEl) {
                    return $(viewEl).data('view').model === stack;
                });

                stackView = $(el).data('view');

                // If this stack is not the last opened stack, create its listing.
                if (this.openStackModel && (stack !== this.openStackModel)) {
                    this.stackDashboards && this.stackDashboards.clearSelection();

                    // Close the last stack and open this one.
                    this.stackDashboards.hide().then(function () {
                        me.stackDashboards.remove();
                        me.openSubTiles(stackView, stack);
                    });
                }
                // If no stack had been opened, open this.
                else if (!this.openStackModel) {
                    me.openSubTiles(stackView, stack);
                }
            }

            // Get the dashboard view.
            el = _.filter(this.$('.dashboard'), function(viewEl) {
                return $(viewEl).data('view').model == dashboard;
            });

            // Select the new dashboard.
            dashboardView = $(el).data('view');
            dashboardView.focus(); // focus the selected dashboard
            if (this.selectedItem !== dashboardView) {
                this.clearSelection();
                this.selectedItem = dashboardView;
                $(el).addClass( this.selectedClassName );
            }
        },

        onItemClick: function (evt) {
            if( !this.isManaging() ) {
                evt.stopPropagation();
                List.prototype.onItemClick.call(this, evt);
            }
        },

        onDashboardClick: function (evt) {
            var currentTarget = $(evt.currentTarget),
                view = currentTarget.data('view');

            // clear sub selection
            this.stackDashboards && this.stackDashboards.clearSelection();

            if ( !this.isManaging() ) {
                this.trigger('dashboard:click', view.model.get('switcherItem'));
            }
        },

        shareDashboard: function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            this.trigger('dashboard:share', getDashboardModel(evt));
        },

        restoreDashboard: function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            this.trigger('dashboard:restore', getDashboardModel(evt));
        },

        editDashboard: function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            this.trigger('dashboard:edit', getDashboardModel(evt));
        },

        deleteDashboard: function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            this.trigger('dashboard:delete', getDashboardModel(evt));
        },

        restoreStack: function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            this.trigger('stack:restore', getStackModel(evt));
        },

        deleteStack: function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            this.trigger('stack:delete', getStackModel(evt));
        },

        closeStack: function () {
            var me = this,
                promise;

            if (this.openStackModel) {
                promise = this.stackDashboards.show().then(function () {
                    me.stackDashboards.remove();
                });
                this.openStackModel = null;
                this.openStackView = null;
                this.stackDashboards = null;
            }
            return promise;
        },

        toggleStack: function (evt) {
            var me = this,
                currentTarget = $(evt.currentTarget),
                view = currentTarget.data('view'),
                model = view.model;

            // If this stack is not the last opened it, create its listing.
            if (this.openStackModel && (model !== this.openStackModel)) {
                this.stackDashboards && this.stackDashboards.clearSelection();

                // Close the last stack and open this one.
                this.closeStack().then(function () {
                    me.openSubTiles(view, model);
                });
            }
            // If it was already open, close the existing stack.
            else if (this.openStackModel) {
                this.closeStack();
            }
            // Otherwise, just open the stack.
            else {
                this.stackDashboards && this.stackDashboards.clearSelection();
                this.openSubTiles(view, model);
            }

            return true;
        },

        openSubTiles: function (view, model) {
            var me = this;

            this.openStackModel = model;
            this.openStackView = view;
            this.stackDashboards = new StackDashboards({
                collection: model.get('children')
            });

            // Bubble up any dashboard events.
            this.listenTo(this.stackDashboards, 'dashboard:click', function (model) {
               me.trigger('dashboard:click', model);
            });
            this.listenTo(this.stackDashboards, 'dashboard:restore', function (model) {
                me.trigger('dashboard:restore', model);
            });
            this.listenTo(this.stackDashboards, 'dashboard:edit', function (model) {
                me.trigger('dashboard:edit', model);
             });
            this.listenTo(this.stackDashboards, 'dashboard:share', function (model) {
                me.trigger('dashboard:share', model);
            });
            this.listenTo(this.stackDashboards, 'dashboard:delete', function (model) {
                me.trigger('dashboard:delete', model);
            });
            this.listenTo(this.stackDashboards, 'tiles:actionsshown', function (model) {
                me.hideAllActions();
            });
            this.listenTo(this.stackDashboards, 'tiles:actionshidden', function (model) {
                me.hideAllActions();
            });

            this.stackDashboards.render();
            this.positionSubTiles(view, this.stackDashboards);

            if (this.isManaging()) {
                this.stackDashboards.toggleManage();
            }
        },

        positionSubTiles: function (tile, stackDashboards) {
            var me = this,
                $items = this.$el.children('.dashboard, .stack'),
                itemOuterWidth = tile.$el.outerWidth(true),
                itemOuterHeight = tile.$el.outerHeight(true),
                parentWidth = this.$el.outerWidth(true),
                $lastItemInRow;

            // get last element in the clicked stack's row
            var numItemsInRow = Math.round( parentWidth / itemOuterWidth ),
                totalItems = $items.length,
                clickedStackIndex = tile.$el.index() + 1;

            if( clickedStackIndex === totalItems || (clickedStackIndex % numItemsInRow) === 0 ) {
                $lastItemInRow = tile.$el;
            }
            else {
                var i = clickedStackIndex;
                while( (i % numItemsInRow) !== 0 ) {
                    i++;
                    if( i >= totalItems ) {
                        break;
                    }
                }
                $lastItemInRow = $items.eq(i-1);
            }

            // Render the stackDashboard.
            stackDashboards.$el.insertAfter( $lastItemInRow );
            stackDashboards.hide();

            // Update the carot position.
            this.stackDashboardsAnchorTip = stackDashboards.$('.stack-dashboards-anchor-tip');
            if (!this.stackDashboardsAnchorTipHeight) {
                this.stackDashboardsAnchorTipHeight = this.stackDashboardsAnchorTip.outerHeight(true);
            }
            if (!this.stackDashboardsAnchorTipWidth) {
                this.stackDashboardsAnchorTipWidth = this.stackDashboardsAnchorTip.outerWidth(true);
            }
            this.stackDashboardsAnchorTip.css({
                left: (tile.$el.position().left + (tile.$el.outerWidth(true) / 2) - (this.stackDashboardsAnchorTipWidth / 2))
            });

            stackDashboards.show();
        },

        toggleManage: function () {
            this._managing = !this._managing;

            if (!this._managing) {
                this.$('.btn-group').hide();
            }

            this.stackDashboards && this.stackDashboards.toggleManage();
        },

        isManaging: function () {
            return this._managing;
        },

        showActions: function (evt) {
            if( !this._managing ) {
                return;
            }

            var $btnGroup = $(evt.currentTarget).find('.btn-group');
            this.$el.find('.btn-group').not($btnGroup).hide();
            $btnGroup.show();

            this.trigger('tiles:actionsshown');
        },

        hideActions: function (evt) {
            if( !this._managing ) {
                return;
            }
            $('.btn-group', evt.currentTarget).hide();
        },

        hideAllActions: function () {
            if( !this._managing ) {
                return;
            }
            this.$el.find('> .dashboard .btn-group, > .stack .btn-group').hide();
            this.trigger('tiles:actionshidden');
        }
    }));

    return Tiles;
});
