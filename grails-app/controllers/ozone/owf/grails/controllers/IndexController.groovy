package ozone.owf.grails.controllers

/**
 * User controller.
 */
class IndexController {

    def index = {
    	def debug = params.debug as Boolean
    	def file = 'web-app/' + (debug ? 'index_debug.html' : 'index.html')
        def htmlContent = new File(file).text
        render text: htmlContent, contentType:"text/html", encoding:"UTF-8"
    }
}
