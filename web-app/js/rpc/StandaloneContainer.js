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
 * This function contains code for a container that can use the RPC
 * API with widgets outside of the OWF container.
 *
 * Public functions on the Ozone.eventing namespace here will NOT be available
 * when running OWF, they are only available when using an external container
 * that includes one of the owf-lite-container*.js files located in the
 * js-min folder in their external container.
 */
 ;(function (window) {
    'use strict';

    var gadgets = window.gadgets = window.gadgets || {},
        json = gadgets.json || {};

    var OWF = window.OWF = window.OWF || {};
    OWF.Comms = window.OWF.Comms = window.OWF.Comms || {};
    OWF.Comms.Constants = window.OWF.Comms.Constants = window.OWF.Comms.Constants || {};
    OWF.RPC = window.OWF.RPC = window.OWF.RPC || {};
    OWF.RPC.priv = window.OWF.RPC.priv = window.OWF.RPC.priv || {};

    var Ozone = window.Ozone = window.Ozone || {};
    Ozone.eventing = window.Ozone.eventing = window.Ozone.eventing || {};

    //////////////////////////////////////////////////////////////////////////
    // private objects and functions
    //////////////////////////////////////////////////////////////////////////

    var activeWidgets = [];

    /**
     * @private
     *
     * @description Checks if the container open is an old version of Internet Explorer.
     * 
     * @returns {Boolean} true if this is an old version of IE
     */
    function isOldIE() {
         return !(typeof window.postMessage === 'function' || typeof window.postMessage === 'object');
    }

    /**
     * @private
     *
     * @description Takes a window name object and stringifies it.
     * 
     * @param {Object} object Window name object
     *
     * @returns {String} Stringified window name object
     */
    function windownameEncode(object) {
        return json.stringify(object);
    }

    /**
     * @private
     *
     * @description Modifies a widget's config to identify it as inside this container.
     * 
     * @param {Object} config The widget's config object
     * @param {String} id The widget's GUID
     * @param {Object} securityToken No longer used
     *
     * @returns {Object} Augmented widget config object
     */
    function augmentConfig(config, id, tunnelURI, securityToken) {
        var relay = getRelayUrl(tunnelURI);

        if (typeof config === 'undefined') {
            config = {
                id: id,

                inContainer: true,
                containerName: 'standalone-rpc-container',
                containerVersion: '1.0',
                containerUrl: getContainerUrl(),

                relayUrl : tunnelURI
            };
        } else {
            config.id = id;

            config.inContainer = true;
            config.containerName = 'standalone-rpc-container';
            config.containerVersion = '1.0';
            config.containerUrl = getContainerUrl();

            config.relayUrl = tunnelURI;
        }
        return config;
    }

    /**
     * @private
     *
     * @description Get the URL of the container.
     *
     * @returns {String} URL of the container
     */
    function getContainerUrl() {
        var lastSlash = window.location.pathname.lastIndexOf('/');
        var shortPath = window.location.pathname.substr(0, lastSlash);
        if (window.location.port != "80" &&
            window.location.port != "443") {
            return window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + shortPath;
        } else {
            return window.location.protocol + "//" + window.location.hostname + shortPath;
        }
    }

    /**
     * @private
     *
     * @description Get the tunnel URL (i.e. relay URL) of the container.
     *
     * @returns {String} Tunnel URL of the container
     */
    function getTunnelUrl() {
        return getContainerUrl() + "/rpc_relay.html";
    }

    var blankNum = 0;

    /**
     * @private
     *
     * @description Get the URL to the blank.html page for this container. Used
     *              when opening widgets in new browser windows.
     *
     * @returns {String} URL to the blank.html file relative to the container URL
     */
    function getBlankPageUrl() {
        blankNum++;
        return getContainerUrl() + "/blank.html?id=" + blankNum;
    }

    /**
     * @private
     *
     * @description Get the relay URL of the container.
     *
     * @returns {String} Relay URL of the container
     */
    function getRelayUrl(url) {
        var protocolIdx = url.indexOf("//");
        var protocolEndIdx = url.indexOf("/", protocolIdx + 2);
        var appEndIdx = url.indexOf("/", protocolEndIdx + 1);
        var relay;
        if(appEndIdx > -1) {
            relay = url.substring(0, appEndIdx + 1) + "rpc_relay.html";
        }
        else {
            // No app context, append directly to end http://domain:port/
            relay = url.substring(0, protocolEndIdx + 1) + "rpc_relay.html";
        }
        return relay;
    }

    /**
     * @deprecated
     * @private
     *
     * @description No longer used.
     *
     * @returns null
     */
    function generateSecurityToken( tokenLength ) {
        return null;
    }

    /**
     * @private
     *
     * @description Checks if an object is undefined or null.
     *
     * @returns {Boolean} true if the object is undefined or null, false otherwise
     */
    function notdefined(x) {
        return (typeof x == 'undefined' || x == null);
    }

    /**
     * @private
     *
     * @description Create the iframe for a widget.
     *
     * @param {String} uri URI to the widget location
     * @param {String} id Widget GUID to use
     * @param {Element} parent Element to append the widget iframe in
     * @param {Object} config The widget's config object
     * @param {String} x The width of the iframe
     * @param {String} y The height of the iframe
     * @param {document} doc Optional document object
     */
    function createIframe(uri, id, parent, config, x,y, doc) {
        var theDocument = doc || document;
        var span = theDocument.createElement( "span" );
        parent.appendChild( span );

        OWF.Comms[id].iframeId = '{\"id\":\"' + id + '\"}';
        var iframeName = windownameEncode(config).replace(/"/g,'&quot;');
        var iframeId = OWF.Comms[id].iframeId.replace(/"/g,'&quot;');

        var iframeText =
                '<iframe id="' + iframeId +
                '" name="' + iframeName +
                '" src="javascript:\'<html></html>\'"' +
                ' style="width:'+x+';height:'+y+';border:0px;" ' +
                '></iframe>';

        span.innerHTML = iframeText;

        theDocument.getElementById( OWF.Comms[id].iframeId ).src = uri;
    }

    /**
     * @private
     *
     * @description Create the iframe for a dialog widget that consumes the entire window.
     *
     * @param {String} uri URI to the widget location
     * @param {String} id Id for the iframe
     * @param {Object} config The dialog widget's config object
     * @param {String} backgroundColor Optional String for the widget's background color
     * @param {String} opacity Optional String for the widget's opacity
     * @param {String} alpha Optional String for the widget's alpha value
     */
    function createDialogIframe(uri, id, config, doc, backgroundColor, opacity, alpha) {

        var div = document.createElement( "div" );
        document.body.appendChild( div );

        notdefined(backgroundColor) && (backgroundColor = "transparent");
        notdefined(opacity) && (opacity = "100");
        notdefined(alpha) && (alpha = "100");

        OWF.Comms[id].iframeId = '{\"id\":\"' + id + '\"}';
        var iframeName = windownameEncode(config).replace(/"/g,'&quot;');
        var iframeId = OWF.Comms[id].iframeId.replace(/"/g,'&quot;');

        var iframeText = '<iframe id="' + iframeId + '"';
        iframeText += ' name="' + iframeName + '"';
        iframeText += ' src="javascript:\'<html></html>\'"';
        isOldIE() && (iframeText += " ALLOWTRANSPARENCY=true FRAMEBORDER=0 ");
        iframeText += ' style="position: absolute;';
        iframeText += 'top: 0px;left: 0px;width: 100%;height: 100%;';
        iframeText += 'border: 0px;x-index: 7500;frameBorder: 0';
        iframeText += 'background-color: '+ backgroundColor+';';
        iframeText += 'filter alpha(opacity=' + alpha + ')';
        iframeText += '"></iframe>';

        div.innerHTML = iframeText;

        document.getElementById( OWF.Comms[id].iframeId ).src = uri;
    }

    //////////////////////////////////////////////////////////////////////////
    // public objects and functions
    //////////////////////////////////////////////////////////////////////////

    /**
     * Setup browser window as widget container. Required initialization method 
     * to support the creation of widgets.
     *
     * @name initializeContainer
     * @methodOf Ozone.eventing
     */
    function initializeContainer(cfg) {
        cfg = cfg || {};

        OWF.RPC.init({
            getIframeId: OWF.Comms.getIframeId
        });

        /**
         * @private
         *
         * @description Does necessary setup for the container regarding function handling when
         *              a widget is loaded.
         *
         * @param {String} iframeId Id of the widget iframe
         * @param {Object} data Data object to pass on to the container
         * @param {Array} functions An Array of functions to register with the container
         */
        OWF.RPC.priv.container_init = function (iframeId, data, functions) {

            OWF.RPC.priv.clientToldUsFunctionsHandler(iframeId, data, functions);

            if (!cfg.dontInitEventing) {
                //set iframe relay file
                var relayUrl = json.parse(data).relayUrl;
                var useMultiPartMessagesForIFPC = json.parse(data).useMultiPartMessagesForIFPC;

                var widgetID = json.parse(iframeId).id;
                OWF.Comms.setRelayUrl(OWF.Comms.getIframeId(widgetID), relayUrl, false, useMultiPartMessagesForIFPC);
                OWF.Comms.setAuthToken(OWF.Comms.getIframeId(widgetID),0);

                var jsonString = '{\"id\":\"' + window.name + '\"}';
                OWF.Comms.send(OWF.Comms.getIframeId(widgetID), OWF.Comms.Constants.AFTER_CONTAINER_INIT_SERVICE_NAME, null, window.name, jsonString);
            }
        };

        OWF.Comms.register(OWF.Comms.Constants.CONTAINER_INIT_SERVICE_NAME, function(iframeId, data, functions) {
            OWF.RPC.priv.container_init(iframeId,data,functions);
        });

        /**
         * @private
         *
         * @description Return the active widgets on the container.
         *
         * @returns {Array} An array of active widget config objects
         */
        function listWidgetsHandler() {
            return activeWidgets;
        }
        OWF.Comms.register(OWF.Comms.Constants.LIST_WIDGETS_SERVICE_NAME, listWidgetsHandler);

        if (!cfg.dontInitAdditionalFeatures) {
            //todo this is StandaloneContainer only
            //detect if gadgets.pubsubrouter is loaded, if so initialize
            if (gadgets.pubsubrouter != null) {
                gadgets.pubsubrouter.init(
                    function(id) {
                        return id;
                    },
                    {
                        onRoute : function (sender, subscriber, channel, message) {
                            //allow all messages to be sent, true means to prevent routing
                            return false;
                        }
                    });
            }

            // TODO: Integrate drag and drop API here once it's done
            // //detect if dragndrop is loaded
            // if (Ozone.dragAndDrop != null && Ozone.dragAndDrop.WidgetDragAndDropContainer != null) {
            //     var wdd = new Ozone.dragAndDrop.WidgetDragAndDropContainer({
            //         eventingContainer: gadgets.pubsubrouter
            //     });
            // }
        }
    }

    /**
     * Create a widget on this page in another iframe,
     * so that it can be used (i.e. add events, call public functions).
     *
     * Note that once created, the proxy will be available in the global Ozone.eventing collection.
     *
     * Only available when using an external container that includes one of
     * the owf-lite-container*.js files in js-min.
     *
     * @name createWidget
     * @methodOf Ozone.eventing
     *
     * @param {String} url The URL of the widget
     * @param {String} widgetId The id of this widget, must be a valid javascript identifier
     * @param {String} parentElementId The id of a parent element or actual parent element for this widget
     * @param {String} x An optional width, a la css width ( "100%", "100px", ...)
     * @param {String} y An optional height, a la css height ( "100%", "100px", ...)
     * @param {Object} config An optional json element with custom data that will be merged into the
     *                        iframes's window.name property. Useful for initial configuration for the widget
     * @param {Function} ready An optional callback to invoke when the widget has been created
     *
     * @returns {OWF.Eventing.WidgetProxy} A proxy object that can be used to send direct messages, handle events,
     *                                       or call functions.
     *
     *  @example
     *  createWidget("http://maps.com/widgetMap", "MyMapWidget", "div1", "100%", "100%", ok);
     *  function ok() {
     *     Ozone.eventing.MyMapWidget.plot(1.1,2.2);
     *  }
     */
    function createWidget(url, widgetId, parentElement, x, y, config, ready) {
        /*jshint validthis:true */
        OWF.Comms[widgetId] = {};
        OWF.Comms[widgetId].callback = function() {};
        OWF.Comms[widgetId].sendMessage = function(dataToSend, callback) {
            OWF.Comms.send(OWF.Comms.getIframeId(widgetId), OWF.Comms.Constants.DIRECT_MESSAGE_CLIENT_SERVICE_NAME, callback, dataToSend);
        };

        parentElement = (typeof parentElement == "string") ? document.getElementById(parentElement) : parentElement;

        var tunnel = getTunnelUrl();
        var securityToken = generateSecurityToken();

        x = x || "100%";
        y = y || "100%";

        config = augmentConfig(config, widgetId, tunnel, securityToken);

        createIframe(url, widgetId, parentElement, config, x, y);
        gadgets.rpc.setRelayUrl(OWF.Comms.getIframeId(widgetId), getRelayUrl(url));

        activeWidgets.push({id:widgetId, name:widgetId, url:url});
        typeof ready == 'function' && ready.call(this, OWF.Comms[widgetId]);
        return OWF.Comms[widgetId];
    }

    /**
     * Create a widget that consumes the entire browser window.
     *
     * Note that once created, the proxy will be available in the global Ozone.eventing collection.
     *
     * Only available when using an external container that includes one of
     * the owf-lite-container*.js files in js-min.
     *
     * @name createDialogWidget
     * @methodOf Ozone.eventing
     *
     * @param {String} url The URL of the widget
     * @param {String} widgetId The id of this widget, must be a valid javascript identifier
     * @param {String} parentElementId The id of a parent element or actual parent element for this widget
     * @param {String} opacity An optional background css opacity for the screen
     * @param {String} alpha An optional background css alpha for the screen
     * @param {Object} config An optional json element with custom data that will be merged into the
     *                        iframes's window.name property. Useful for initial configuration for the widget
     * @param {Function} ready An optional callback to invoke when the widget has been created
     *
     * @returns {OWF.Eventing.WidgetProxy} a proxy object that can be used to send direct messages, handle events,
     *                                       or call functions.
     *  
     * @example
     * createWidget("http://maps.com/widgetMap", "MyMapWidget", "div1", "100%", "100%", ok);
     * function ok() {
     *    Ozone.widgets.MyMapWidget.plot(1.1,2.2);
     * }
     */
    function createDialogWidget(url, widgetId, backgroundColor, opacity, alpha, config, ready) {
        /*jshint validthis:true */
        var proxy = {};
        proxy.sendMessage = function(dataToSend, callback) {
            OWF.Comms.send(OWF.Comms.getIframeId(widgetId), OWF.Comms.Constants.DIRECT_MESSAGE_CLIENT_SERVICE_NAME, callback, dataToSend);
        };
        OWF.Comms[widgetId] = proxy;

        var tunnel = getTunnelUrl();
        var securityToken = generateSecurityToken();

        config = augmentConfig(config, widgetId, tunnel, securityToken);

        createDialogIframe(url, widgetId, config, backgroundColor, opacity, alpha);
        gadgets.rpc.setRelayUrl(OWF.Comms.getIframeId(widgetId), getRelayUrl(url));

        activeWidgets.push({id:widgetId, url:url});
        typeof ready == 'function' && ready.call(this, OWF.Comms[widgetId]);
        return proxy;
    }

    /**
     * Create a widget in a popup window. 
     *
     * Note that once created, the proxy will be available in the global Ozone.eventing collection.
     *
     * Only available when using an external container that includes one of
     * the owf-lite-container*.js files in js-min.
     *
     * @name createWindowWidget
     * @methodOf Ozone.eventing
     *
     * @param {String} url The URL of the widget
     * @param {String} widgetId The id of this widget, must be a valid javascript identifier
     * @param {String} parentElementId The id of a parent element or actual parent element for this widget
     * @param {String} width An optional width in pixels of the popup window (default 100)
     * @param {String} height An optional height in pixels of the popup window (default 100)
     * @param {Number} resizable An optional flag, 1 to make the popup resizable, 0 not (default 0)
     * @param {Number} scrollbars An optional flag 1 to show scrollbars, 0 not (default 0)
     * @param {Object} config An optional json element with custom data that will be merged into the
     *                        iframes's window.name property. Useful for initial configuration for the widget
     * @param {Function} ready An optional callback to invoke when the widget has been created
     *
     * @returns {OWF.Eventing.WidgetProxy} a proxy object that can be used to send direct messages, handle events,
     *                                       or call functions.
     *  
     * @example
     * createWidget("http://maps.com/widgetMap", "MyMapWidget", "div1", "100%", "100%", ok);
     * function ok() {
     *    Ozone.widgets.MyMapWidget.plot(1.1,2.2);
     * }
     */
    function createWindowWidget(url, widgetId, width, height, resizable, scrollbars, blankPageUrl, config, ready) {
        var proxy = {};
        proxy.sendMessage = function(dataToSend, callback) {
            OWF.Comms.send(OWF.Comms.getIframeId(widgetId), OWF.Comms.Constants.DIRECT_MESSAGE_CLIENT_SERVICE_NAME, callback, dataToSend);
        };

        notdefined(width) && (width = 100);
        notdefined(height) && (height = 100);
        notdefined(resizable) && (resizable = 0);
        notdefined(scrollbars) && (scrollbars = 0);
        var windowOptions = "width=" + width + ",height=" + height + ",resizable=" + resizable + ",scrollbars=" + scrollbars;

        notdefined(blankPageUrl) && (blankPageUrl = getBlankPageUrl());

        var childWindow = window.open(blankPageUrl,'_blank',windowOptions);

        if (typeof window.parent._childWindows === 'undefined') {
            window.parent._childWindows = [];
        }
        window.parent._childWindows.push(childWindow);

        function initializeChildWindow() {
            /*jshint validthis:true */
            var parentElement = childWindow.document.getElementsByTagName("body")[0];

            var tunnel = getTunnelUrl();
            var securityToken = generateSecurityToken();

            config = augmentConfig(config, widgetId, tunnel, securityToken);

            createIframe(url, widgetId, parentElement, config, "100%", "100%", childWindow.document);
            gadgets.rpc.setRelayUrl(OWF.Comms.getIframeId(widgetId), getRelayUrl(url));

            typeof ready == 'function' && ready.call(this);
        }

        function delayInit() {
            setTimeout(initializeChildWindow, 1000);
        }

        if ( childWindow.addEventListener ) {
            childWindow.addEventListener( "load", initializeChildWindow, false );
        } else if ( window.attachEvent ) {
            //this doesn't seem to work in IE
            //childWindow.attachEvent( "onload", delayInit );
            delayInit();
        }

        OWF.Comms[widgetId] = proxy;
        activeWidgets.push({id:widgetId, url:url});
        return proxy;
    }

    OWF.Comms.createWidget = Ozone.eventing.createWidget = createWidget;
    OWF.Comms.createWindowWidget = Ozone.eventing.createWindowWidget = createWindowWidget;
    OWF.Comms.createDialogWidget = Ozone.eventing.createDialogWidget = createDialogWidget;
    OWF.Comms.initializeContainer = Ozone.eventing.initializeContainer = initializeContainer;
    OWF.Comms.getIframeId = Ozone.eventing.getIframeId = function (widgetId) {
        return OWF.Comms[widgetId].iframeId;
    };
}(window));
