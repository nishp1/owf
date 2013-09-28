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
    'views/panes/AccordionPane',
    'views/panes/DesktopPane',
    'views/panes/FitPane',
    'views/panes/TabbedPane',
    'views/panes/PortalPane',
    'views/panes/LayoutPane',
    'views/View',
    'views/box/HBox',
    'views/box/VBox',
    'views/panes/Pane',
    'views/panes/BoxPane',
    'views/widgets/Window',
    'views/widgets/FloatingWidget',
    'views/widgets/WidgetControlIframe',
    'collections/WidgetStates',
    'models/WidgetState',
    'mixins/dashboard/ConstrainWidgets',
    'services/CollectionViewService',
    'services/ZIndexManager',
    'util/containerUtil',
    'jwerty',
    'backbone',
    'lodash',
    'jquery'
], function (AccordionPane, DesktopPane, FitPane, TabbedPane, PortalPane, LayoutPane, View, HBox,
             VBox, Pane, BoxPane, WidgetWindow, FloatingWidget, WidgetControlIframe, WidgetStates,
             WidgetState, ConstrainWidgets, CollectionViewService, ZIndexManager, ContainerUtil, 
             jwerty, Backbone, _, $) {

    'use strict';

    return View.extend(_.extend({}, ConstrainWidgets, {
        vtype: 'dashboardinstance',

        className: 'dashboard',

        //whenever a drag event is occurring,
        //display a mask over the dashboard to prevent widget iframes
        //from interfering with mouseovers
        events: {
            'dragstart': 'showMask',
            'dragstop': 'hideMask',
            'resizestart': 'showMask',
            'resizestop': 'hideMask',
            'sortstart': 'showMask',
            'sortstop': 'hideMask'
        },

        resizeDebounceTime: 500,

        // interval in ms at which to save dashboard
        saveInterval: 15 * 60 * 1000,

        // z-index manager for dashboard level floating widgets
        floatingWidgetsZIndexManager: null,

        views: function () {
            return this.model && this.model.getLayoutConfig();
        },

        initialize: function() {
            View.prototype.initialize.apply(this, arguments);

            this.floatingWidgetsZIndexManager = new ZIndexManager();

            _.bindAll(this, 'onResize', 'save');

            // save dashboard at every this.saveInterval ms
            this._saveIntervalId = setInterval(this.save, this.saveInterval);

            this.onResize  = _.debounce(this.onResize, this.resizeDebounceTime);
            $(window).on('resize', this.onResize);
        },

        showMask: function(evt) {
            this.$el.children('.mask').removeClass('hide');
        },

        hideMask: function(evt) {
            this.$el.children('.mask').addClass('hide');
        },

        render: function() {
            View.prototype.render.call(this);

            //create the drag mask
            this.$el.append('<div class="mask hide" />');
            return this;
        },

        afterRender: function() {
            var me = this,
                floatingWidgets = me.model.get('floatingWidgets'),
                backgroundWidgets = me.model.get('backgroundWidgets');

            floatingWidgets.filterInaccessibles({ silent: true });
            backgroundWidgets.filterInaccessibles({ silent: true });
            
            // render floating widgets
            new CollectionViewService().renderCollection({
                $body: me.$el,
                collection: floatingWidgets,
                viewFactory: function(model) {
                    return new FloatingWidget({
                        model: model,
                        containment: me.$el,
                        zIndexManager: me.floatingWidgetsZIndexManager
                    });
                }
            });

            // render background widgets
            new CollectionViewService().renderCollection({
                $body: me.$el,
                collection: backgroundWidgets,
                viewFactory: function(model) {
                    return new WidgetControlIframe({
                        model: model,
                        containment: me.$el
                    });
                }
            });

            return me;
        },

        // calls doLayout method on each layout pane
        // helpful when layout of widgets is DOM dependent
        doPaneLayout: function () {
            _.invoke(this.layoutPanes(), 'doLayout');
        },

        onResize: function () {
            var view = this.views[0];

            // bring any floating hidden widgets in viewport
            this.adjustHiddenHeaders();

            // do pane layout if pane is direct child of dashboard
            if(view instanceof LayoutPane) {
                view.doLayout();
            }
        },

        layoutPanes: function () {
            if(!this._layoutPanes) {
                this._layoutPanes = _.map(this.$el.find('.layoutpane'), function (layoutPane) {
                    return $(layoutPane).data('view');
                });
            }
            return this._layoutPanes;
        },

        save: function (options) {
            var $layoutPanes = this.$el.find('.layoutpane'),
                state, layoutPane, force, async;

            options = options || {};
            force = options.force;
            async = _.isBoolean(options.async) ? options.async : true;

            // save state of each layout pane
            _.invoke(this.layoutPanes(), 'save');

            state = this.model.toJSON();

            // don't save if dashboard state hasn't changed from previous save
            if(!force && this._previousState && _.isEqual(this._previousState, state)) {
                return $.Deferred().resolve();
            }

            // cache previous state
            this._previousState = state;

            // save dashboard model
            return this.model.save(null, { async: async });
        },

        remove: function() {
            // clear save interval
            clearInterval(this._saveIntervalId);

            $(window).off('resize', this.onResize);

            View.prototype.remove.call(this);
        },

        launchWidget: function (pwdModel, opts) {
            var deferred = $.Deferred(),
                model;

            pwdModel = pwdModel.clone();
            pwdModel.id = ContainerUtil.guid();
            pwdModel.set('id', pwdModel.id);

            model = WidgetState.createFromPersonalWidgetDefinition(pwdModel);

            //set dashboardGuid property to reference this dashboard
            model.set('dashboardGuid', this.model.id || this.model.cid);

            //todo validate here there can be only one singleton widget open
            // if (model.get('isSingleton')) {

            // }

            if (!model.src()) {
                deferred.reject(model, opts);
            }
            // else if (model.get('isBackground')) {

            // }
            //todo floating widgets?
            else {
                //check if there is only one pane if so then just launch
                if (this.views.length === 1 && this.views[0] instanceof LayoutPane) {
                    var paneView = this.views[0];
                    paneView.launchWidget(model,opts);
                    deferred.resolve(model, opts);
                }
                else {
                    //initiate selectPane phase
                    this.selectPane(opts).then(function (evt, paneView) {
                        paneView.launchWidget(model,opts);
                        deferred.resolve(model, opts);

                    }, function () {
                        deferred.reject(model, opts);
                    });
                }
            }
            return deferred.promise();
        },

        shim: function () {},

        unshim: function () {},

        selectPane: function (opts) {
            var me = this,
                    dfd = $.Deferred(),
                    //put up all paneshims
                    $shims = this.$('.paneshim').removeClass('hide');

            //highlight pane during mouseover
            this.$el.on('mouseover', '.pane', function (evt) {
                evt.stopPropagation();
                //console.log('over pane');
                $(evt.target).addClass('over');
            });

            //unhighlight when mouse leaves
            this.$el.on('mouseout', '.pane', function (evt) {
                evt.stopPropagation();
                //console.log('out of pane ');
                $(evt.target).removeClass('over');
            });

            //check whether this is selecting a pane via dragdrop or click/keyboard
            if (opts != null && opts.byDragDrop) {
                //selecting a pane by dragging and dropping

                // mouseup outside of the dasboard
                $(document).one('mouseup', function (evt) {
                    // mouseup outside of the dashboard => reject the deferred
                    if (dfd.state() === 'pending') {
                        dfd.reject();
                    }
                    // cleanup listeners added for launching
                    me.$el.off('mouseover', '.pane');
                    me.$el.off('mouseout', '.pane');
                });

                // mouseup in dashboard
                this.$el.one('mouseup', '.pane', function (evt) {
                    var $target = $(evt.target),
                            $currentTarget = $(evt.currentTarget);

                    //console.log('pane selected');

                    $target.removeClass('over');
                    $shims.addClass('hide');

                    dfd.resolve(evt, $currentTarget.data('view'));
                });
            }
            else {
                //select pane by click or keyboard enter

                //if escape is pressed then cancel selectpane
                var escHandler = jwerty.event('esc', function () {
                    if (dfd.state() === 'pending') {
                        dfd.reject();
                    }
                    // cleanup listeners added for launching
                    me.$el.off('mouseover', '.pane');
                    me.$el.off('mouseout', '.pane');
                });
                $(document).one('keydown', escHandler);

                // click in dashboard
                this.$el.one('click', '.pane', function (evt) {
                    var $target = $(evt.target),
                            $currentTarget = $(evt.currentTarget);

                    //console.log('pane selected');

                    $target.removeClass('over');
                    $shims.addClass('hide');

                    // cleanup listeners added for launching
                    me.$el.off('mouseover', '.pane');
                    me.$el.off('mouseout', '.pane');

                    //remove esc listener in case it was never fired
                    $(document).off('keydown', escHandler);

                    dfd.resolve(evt, $currentTarget.data('view'));
                });

            }

            return dfd.promise();
        },

        /**
         * Returns an array of all the opened widgets on the dashboard, including data
         * required for RPC API communication specifically.
         *
         * @param {Array} personalWidgetDefs An array of this person's widget definitions
         * @returns {Array} An array of widget data objects
         */
        getOpenedWidgets: function (personalWidgetDefs) {
            var model = this.model,
                layoutConfig = model.getLayoutConfig(),
                paneWidgets = model.getPaneWidgetsFromLayoutConfig(layoutConfig),
                backgroundWidgets = model.get('backgroundWidgets').toJSON(),
                floatingWidgets = model.get('floatingWidgets').toJSON(),
                widgets = paneWidgets.concat(backgroundWidgets).concat(floatingWidgets),
                widgetDefs = personalWidgetDefs.pluck('widgetDefinition'),
                widget,
                widgetIframe,
                widgetGuid,
                widgetDef,
                returnValue = [];

            for(var i = 0; i < widgets.length; i++) {
                widget = widgets[i];

                //Get the widget iframe so we can return its id
                widgetIframe = this.$el.find('iframe[name*="' + widget.id + '"]');

                //Search the person's widget defs for this widget
                for(var j = 0; j < widgetDefs.length; j++) {
                    widgetDefs[j].get('id') === widget.widgetGuid && (widgetDef = widgetDefs[j]);
                }

                if(widgetDef) {
                    returnValue.push({
                        //RPC fields
                        id: widget.id,
                        name: widget.name,
                        url: widgetDef.get('widgetUrl'),

                        //Extra info
                        frameId: widgetIframe.attr('id'),
                        widgetGuid: widget.widgetGuid,
                        widgetName: widgetDef.get('displayName'),
                        universalName: widgetDef.get('universalName')
                    });
                }
            }
            return returnValue;
        }
    }));
});
