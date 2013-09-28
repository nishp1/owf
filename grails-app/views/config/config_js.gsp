<%@ page import="grails.converters.JSON" contentType="text/javascript" %>
<%@ page import="grails.util.Environment" %>
<%@ page import="ozone.security.SecurityUtils" %>

define('config', ['lodash'], function (_) {
    'use strict';

    var Config = ${conf} || {};

    //add in contextPath
    Config.webContextPath = window.location.pathname;

    // fixes 'Error: Illegal Operator !=' error in IE
    Config.webContextPath = Config.webContextPath.replace(/\;jsessionid=.*/g,'');

    if(Config.webContextPath.charAt(Config.webContextPath.length - 1) === '/') {
        Config.webContextPath = Config.webContextPath.substr(0,Config.webContextPath.length - 1);
    }

    Config.user = ${user};

    Config.widgetNames = ${widgetNames};

    Config.banner = ${bannerState};

    Config.currentTheme = ${currentTheme};

    Config.loginCookieName = ${Environment.current == Environment.DEVELOPMENT ? 
                                    "null" :
                                    "'" + ozone.security.SecurityUtils.LOGIN_COOKIE_NAME + "'"};

    Config.prefsLocation = window.location.protocol + "//" + window.location.host + window.location.pathname + "prefs";

    Config.prefsLocation = Config.prefsLocation.replace(/\;jsessionid=.*/g,'');

    Config.getContainerUrl = function() {
        //figure out from preference location
        var pref = Config.prefsLocation;
        return pref.substring(0, pref.length - 6);
    };

    var ozoneOwfConfigProperties = {
        //this value controls whether the OWF UI uses shims on floating elements, setting this to true will make
        //Applet/Flex have less zindex issues, but browser performance may suffer due to the additional shim frames being created
        useShims: false
    };
    
    return _.extend(Config, ozoneOwfConfigProperties, {
        initialWidgetDefinitions: ${widgets},
        initialDashboards: ${dashboards}
    });
});