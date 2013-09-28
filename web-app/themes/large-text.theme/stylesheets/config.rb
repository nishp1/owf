# Sass files are compiled in the target/minified-output folder, the paths below are relative to the individual theme directories inside there
$common_path = "../../common/" # Location of owf's stylesheets and images that are common to mutiple themes
$image_path = "../images/"  # Path to the images directory in this theme

$ext_dir = "../../../../../../target/minified-output/" # Relative location of external resources
$ext_lib_path = $ext_dir + "libs/" # Location of stylesheets and images belonging to external libraries

# sass_dir: The directory where the sass stylesheets are kept.
sass_dir = "stylesheets"

# sass_path: the directory your Sass files are in. THIS file should also be in the Sass folder
sass_path = File.dirname(__FILE__)

# css_path: the directory you want your CSS files to be.
# Generally this is a folder in the parent directory of your Sass files
css_path = File.join(sass_path, "..", "css")

# images_dir: Explicitly set to an empty string for proper functioning of theme_image() in lib/owf_utils.rb
images_dir = ""

# fonts_dir
relative_assets = true
fonts_dir = "../../../libs/fonts"

# output_style: The output style for your compiled CSS, can be nested, expanded, compact, compressed
# More information can be found here http://sass-lang.com/docs/yardoc/file.SASS_REFERENCE.html#output_style
output_style = :expanded

# load compass_init.rb file
load File.join(File.dirname(__FILE__), $common_path)

# We need to load the OWF Common Stylesheets
add_import_path File.join(File.dirname(__FILE__), $common_path + sass_dir)

# Load in the sass content from external libraries (e.g. Twitter Bootstrap)
add_import_path File.join(File.dirname(__FILE__), $ext_lib_path + sass_dir)