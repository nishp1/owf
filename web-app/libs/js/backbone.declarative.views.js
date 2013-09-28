/* global Backbone, _ */

;(function(Backbone, _) {
    
    var map = {};
    Backbone.ViewManager = {
        register: function (key, impl) {
            key && (map[key] = impl);
        },
        get: function (key) {
            return (map[key] || Backbone.View);
        }
    };
    var extend = Backbone.View.extend,
        origBackboneView = Backbone.View;
    
    Backbone.View = Backbone.View.extend({
        
        // array of views or a single view
        views : null,

        autoRender: false,

        isRendered: false,

        initialize: function () {
            this.views = this.options.views || this.views;
            this.viewsConfig = _.result(this, 'views');
            this.initViews();

            if(this.autoRender || this.options.autoRender) {
                this.render();
            }
            return this;
        },

        initViews: function () {
            this.views = [];
            this.viewsConfig = this.viewsConfig ? [].concat(this.viewsConfig) : [];

            for(var i = 0; i < this.viewsConfig.length; i++) {
                this.initView( this.viewsConfig[i] );
            }
        },

        initView: function (config, index) {
            var view,
                vtype = config.vtype;

            if(vtype) {
                if(_.isString(vtype)) {
                    var Impl = Backbone.ViewManager.get(vtype);
                    view = new Impl(config);
                }
                else {
                    view = new config.vtype(config);
                }
            }

            if (index == null) {
                this.views.push( view );
            }
            else {
                this.views.splice( index, 0, view );
            }

            return view;
        },

        // beforeRender is an empty function by default. Override it with your own
        // before render logic.
        beforeRender: function() {},

        // render handles rendering of child views.
        render: function () {
            if(this.isRendered === true) {
                return this;
            }

            var me = this,
                frag = document.createDocumentFragment();
            
            this.beforeRender();
            
            _.each(this.views, function (view, index) {
                var options = view.options,
                    autoRender = options.autoRender,
                    renderTo = options.renderTo;

                if(autoRender !== false) {
                    view.render();
                    
                    if(renderTo) {
                        _.isString(renderTo) ? 
                            me.$el.find(renderTo).append(view.el) : renderTo.append(view.el);
                    }
                    else {
                        frag.appendChild(view.el);
                    }
                }
            });

            this.el.appendChild(frag);
            this.isRendered = true;
            
            this.afterRender();
            return this;
        },

        // afterRender is an empty function by default. Override it with your own
        // after render logic.
        afterRender: function() {},

        addView: function ( config, index ) {
            var me = this,
                view;
            if( config instanceof Backbone.View ) {
                view = config;
                if (index == null) {
                    this.views.push( view );
                }
                else {
                    this.views.splice( index, 0, view );
                }
            }
            else {
                view = this.initView( config, index );
            }
            view.render();
            var renderTo = (view.renderTo || view.options.renderTo || this.$el);
            
            if(renderTo) {
                _.isString(renderTo) ? 
                    me.$el.find(renderTo).append(view.el) : renderTo.append(view.el);
            }

            return view;
        },

        getView: function (vid) {
            return _.find(this.views, function (view) {
                return view.options.vid === vid;
            });
        },

        removeView: function (view) {
            if(_.isString(view)) {
                view = this.getView( view );
            }
            if( view ) {
                var index = _.indexOf( this.views, view );

                this.viewsConfig = _.rest( this.viewsConfig, index + 1 );
                this.views = _.without( this.views, view );

                view.remove();
            }
        },

        remove: function () {
            this.isRendered = false;

            if(this.views && this.views.length > 0) {
                _.invoke(this.views, 'remove');
            }
            origBackboneView.prototype.remove.apply(this, arguments);
        }
    });

    Backbone.View.extend = function (protoProps, staticProps) {
        var child = extend.apply(this, arguments);
        if(protoProps.vtype && !_.isString(protoProps.vtype)) {
            throw new Error('vtype must be a string');
        }
        Backbone.ViewManager.register(protoProps.vtype, child);
        return child;
    };

})(Backbone, _);
