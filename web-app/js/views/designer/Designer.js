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
    'views/box/HBox',
    'views/box/VBox',
    './Pane',
    './WorkingArea',
    './SidePanel',
    'views/Warning',
    'services/Dashboard',
    'services/KeyboardManager',
    'mixins/CircularFocus',
    'jquery',
    'lodash',
    'handlebars',
    'jqueryui/jquery.ui.draggable',
    'jqueryui/jquery.ui.droppable',
    'jquery-splitter'
],
function(View, HBox, VBox, Pane, WorkingArea, SidePanel, Warning, DashboardService, KeyboardManager, CircularFocus, $, _, Handlebars) {

    'use strict';

    var HIGHLIGHT_CLASS = 'highlight',
        PANE_SELECTOR = '.pane[tabindex="0"]',
        $doc = $(document),
        tpl = 
            '<div class="actions">' +
                '<div class="pull-left btn-group">' +
                    '<button class="btn btn-danger enabled reset-btn" tabindex="0" href="#">Reset</button>' +
                    '<button class="btn lock-btn" tabindex="0" href="#">' + 
                        '<i class="{{#if locked}}icon-unlock{{else}}icon-lock{{/if}}"></i>' + 
                        '<span>{{#if locked}}Unlock{{else}}Lock{{/if}}</span>' + 
                    '</button>' +
                '</div>' +
                '<div class="pull-right btn-group">' +
                    '<button class="btn cancel-btn" tabindex="0" href="#">Cancel</button>' +
                    '<button class="btn btn-primary save-btn" tabindex="0" href="#">Save</button>' +
                '</div>' +
            '</div>';

    return View.extend(_.extend({}, CircularFocus, {

        id: 'dashboard-designer',

        template: Handlebars.compile(tpl),

        events: {
            'click .reset-btn': 'reset',
            'click .lock-btn': 'lock',
            'click .save-btn': 'save',
            'click .cancel-btn': 'cancel'
        },

        keynavEvents: {
            'keyup(space) .ruletype': '_keynavNest',
            'keyup(space) .panetype': '_keynavUpdatePaneType'
        },

        workingArea: null,

        sidePanel: null,

        layoutConfig: null,
        
        isLocked: null,

        views: function() {
            return [{
                vtype: 'workingArea',
                vid: 'workingArea',
                model: this.model,
                layoutConfig: this.layoutConfig
            }, {
                vtype: SidePanel,
                vid: 'sidePanel'
            }];
        },

        initialize: function () {
            this.isLocked = this.model.get('isLocked');
            this.layoutConfig = DashboardService.convertForDesigner(_.cloneDeep(this.model.getLayoutConfig()));

            View.prototype.initialize.apply( this, arguments );
        },

        afterRender: function() {
            this.$el.append(this.template({
                locked: this.model.get('isLocked')
            })); 
            
            this.workingArea = this.getView('workingArea');
            this.sidePanel = this.getView('sidePanel');
            
            this._initDragAndDrop();
            this.initCircularFocus();
        },
        
        design: function() {
            this.render();
            this._deferred = $.Deferred();
            return this._deferred.promise();
        },

        reset: function (evt) {
            var $resetBtn = $(evt.target);
            if( $resetBtn.hasClass('disabled') ) {
                return;
            }

            this.workingArea.reset( this.model.getPaneWidgetsFromLayoutConfig() );
            $resetBtn.addClass('disabled');
            this.reinitCircularFocus();
        },

        enableReset: function () {
            this.$el.find('.reset-btn').removeClass('disabled');
        },

        lock: function (evt) {
            var me = this,
                dashboard = this.model,
                $lockBtn = $(evt.currentTarget);

            if( !dashboard.get('isLocked') ) {
                var modal = new Warning({
                    title: 'Lock Dashboard',
                    content: 'Locking this dashboard disables the Launch Menu. New widgets cannot be launched or added to this layout. Do you still want to lock this dashboard?',
                    ok: function (evt) {
                        modal.hide();
                        dashboard.set('isLocked', true);
                        $lockBtn.children('span').html('Unlock');
                        $lockBtn.children('i').addClass('icon-unlock').removeClass('icon-lock');
                    }
                });
                modal.show();
            }
            else {
                dashboard.set('isLocked', false);
                $lockBtn.children('span').html('Lock');
                $lockBtn.children('i').addClass('icon-lock').removeClass('icon-unlock');
            }
        },

        show: function () {
            this.sidePanel.focus();
            return View.prototype.show.call(this);
        },

        save: function () {
            var config = this.workingArea.getLayoutConfig();
            this._deferred.resolve( DashboardService.convertForDashboard(config) );
        },

        cancel: function () {
            this.model.set('isLocked', this.isLocked);
            this.remove();
            this._deferred.reject();
        },

        nest: function (pane, ruletype) {
            pane.nest(ruletype);

            // layout changes when nesting
            // reinitialize circular focus
            this.reinitCircularFocus();
            this.enableReset();
        },

        updatePaneType: function (pane, panetype) {
            // update pane type
            var dfd = $.Deferred(),
                widgets = pane.getWidgets(),
                warning, text;

            if( panetype === 'fitpane' && widgets.length > 1) {
                text = '<p>You are about to set a single-widget Fit layout to a pane containing ' +
                            widgets.length +
                            ' widgets. On save, all widgets in the pane except for <i>' +
                            widgets[0].name + 
                            '</i> will be removed from the dashboard.</p>' +
                            '<p>Set to Fit layout and <b>permanently</b> remove the other widgets?</p>';

                warning = new Warning({
                    title: 'Warning',
                    removeOnClose: true,
                    okClassName: 'btn-danger',
                    cancel: function () {
                        dfd.reject();
                    },
                    ok: function() {
                        pane.setPaneType(panetype);
                        pane.setWidgets(widgets[0]);
                        this.hide().then(function () {
                            dfd.resolve();
                        });
                    }
                });

                warning.render().$body.append( text );
                warning.show();
            }
            else {
                pane.setPaneType(panetype);
                dfd.resolve();
            }

            return dfd.promise();
        },

        remove: function () {
            // delete cached jquery objects on remove
            // to prevent errors if remove is called twice
            if(this._$draggables) {
                this._$draggables.draggable('destroy');
                delete this._$draggables;
            }

            if(this._$droppables) {
                this._$droppables.droppable('destroy');
                delete this._$droppables;
            }

            // reject select pane deferred in case user click cancel
            if(this._selectPaneDeferred) {
                this._selectPaneDeferred.reject();
            }

            this.tearDownCircularFocus();
            View.prototype.remove.call( this );
        },
        
        /*====================================================
        =            Private Methods & Properties            =
        =====================================================*/

        _$draggables: null,
        
        _$droppables: null,
        

        _initDragAndDrop: function() {
            this._$draggables = this.sidePanel.$('li').draggable({
                cursorAt: { left: -10, top: -10 },
                helper: function(evt) {
                    var $el = $(this.cloneNode(true)),
                        elHtml = $('<div></div>').append($el).html();
                    
                    return $(elHtml);
                },
                scroll: false,
                start: _.bind(this._onDragStart, this),
                stop: _.bind(this._onDragStop, this)
            });

            this._$droppables = this.workingArea.$el.droppable({
                tolerance: 'pointer',
                drop: _.bind(this._onDrop, this)
            });
        },

        _onMouseOverPane: function (evt) {
            this._$mouseOverPane = $(evt.target).addClass(HIGHLIGHT_CLASS);
        },

        _onMouseOutPane: function  () {
            this._$mouseOverPane && this._$mouseOverPane.removeClass(HIGHLIGHT_CLASS);
            delete this._$mouseOverPane;
        },

        _onDragStart: function(evt, ui) {
            $(ui.helper).data({
                ruletype: $(evt.target).data('ruletype'),
                panetype: $(evt.target).data('panetype')
            });

            $doc
                .on('mouseenter.designerdrag', '.working-area, .working-area .pane', _.bind(this._onMouseOverPane, this))
                .on('mouseleave.designerdrag', '.working-area, .working-area .pane', _.bind(this._onMouseOutPane, this));
        },
        
        _onDrop: function (evt, ui) {
            // jquery ui executes onDrop handler when proxy is above draggables
            if(!this._$mouseOverPane) {
                return;
            }
            var data = $(ui.helper).data(),
                view = this._$mouseOverPane.data().view;

            if( data.ruletype ) {
                this.nest(view, data.ruletype);
            }
            else {
                this.updatePaneType(view, data.panetype);
            }

            this._$mouseOverPane.removeClass( HIGHLIGHT_CLASS );
            this.enableReset();
        },

        _onDragStop: function (evt, ui) {
            $doc.off('.designerdrag');
        },

        _keynavNest: function (evt) {
            var me = this,
                $el = $(evt.currentTarget),
                ruletype = $el.data('ruletype');

            this._selectPane()
                .then(function (pane) {
                    me.nest(pane, ruletype);
                })
                .always(function () {
                    $el.focus();
                });
        },

        _keynavUpdatePaneType: function (evt) {
            var me = this,
                $el = $(evt.currentTarget),
                panetype = $el.data('panetype');
            
            this._selectPane()
                .then(function (pane) {
                    return me.updatePaneType(pane, panetype);
                })
                .always(function () {
                    // timeout to prevent keyup from firing on side panel
                    setTimeout(function() {
                        $el.focus();
                    }, 200);
                });
        },

        _selectPane: function () {
            var me = this,
                dfd = $.Deferred(),
                $panes = this.workingArea.$el.find('.pane'),
                panes;

            // disable pane editing until pane selected
            panes = _.map($panes, function (pane) {
                return $(pane).data('view');
            });
            _.invoke(panes, 'disableEditable');

            // enable pane editing after pane selection
            me._selectPaneDeferred = dfd.always(function() {
                _.invoke(panes, 'enableEditable');
            });

            function resolve (el) {
                dfd.resolve( $(el).data('view') );
            }

            function reject () {
                dfd.reject();
            }

            function paneSelected (evt) {
                resolve(evt.currentTarget);
            }

            // if only one resolve promise with that pane
            // no need to have user select it
            if($panes.length === 1) {
                resolve($panes);
            }
            else {
                // initialize circular focus in working area
                this.workingArea.initCircularFocus().focus();

                dfd.always(function () {
                    me.$el.off('.selectPane');
                    me.workingArea.tearDownCircularFocus();
                    me.reinitCircularFocus();
                    
                    delete me._selectPaneDeferred;
                });

                // allow user to select it throuhg click or enter
                this.$el.on('click.selectPane', PANE_SELECTOR, paneSelected);

                // manage keyboard events
                KeyboardManager.on(this.$el, 'keyup(space).selectPane', PANE_SELECTOR, paneSelected);
                KeyboardManager.on(this.$el, 'keyup(esc).selectPane', PANE_SELECTOR, reject);
            }

            return dfd.promise();
        }
    }));

});
