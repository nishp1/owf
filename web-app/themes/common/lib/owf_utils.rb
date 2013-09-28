module OWF
    module SassExtensions
        module Functions
            module Utils
                # Returns a background-image property for a specified image for the theme.
                # If path is relative, looks in the theme's images directory, then common/images
                # if the file could not be found. If not relative, it looks in both directories,
                # then searches the external libs/images directory for the image.
                def theme_image(theme, path, without_url = false, relative = false)
                    path = path.value
                    theme = theme.value + '.theme'
                    without_url = (without_url.class == FalseClass) ? without_url : without_url.value

                    relative_path = "../../../"

                    if relative
                        if relative.class == Sass::Script::String
                            relative_path = relative.value
                            relative = true
                    end
                    else
                        relative = false
                    end


                    if relative
                        image_path = File.join(relative_path, theme, 'images', path)
                        if not File.exists?(image_path)
                            #if the image wasn't found in the theme, look in common
                            image_path = File.join(relative_path, 'common', 'images', path)
                        end
                    else
                        #not relative, not common, use default image path
                        image_path = File.join($image_path, path)
                        if not File.exists?(image_path)
                            #if the image wasn't found in the theme, look in common
                            image_path = File.join($common_path, 'images', path)
                            if not File.exists?(image_path)
                                #if the image wasn't found in common, look in external libs
                                image_path = File.join($ext_lib_path, 'images', path)
                            end
                        end

                        # Remove 'target/minified-output/' if found in image_path, url shouldn't include it
                        image_path.gsub!($ext_dir, relative_path)
                    end

                    if !without_url
                        url = "url('#{image_path}')"
                    else
                        url = "#{image_path}"
                    end

                    Sass::Script::String.new(url)
                end

                #Takes either a list containing a color followed by a color stop percentage, or 
                #just a color.  Returns the color
                def strip_stop(color_w_stop)
                    (color_w_stop.class == Sass::Script::Color) ? color_w_stop : color_w_stop.to_a[0]
                end
            end
        end
    end
end

module Sass::Script::Functions
    include OWF::SassExtensions::Functions::Utils
end