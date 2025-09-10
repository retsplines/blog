/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig, options) {

    // Add a shortcode for downloading files
    eleventyConfig.addShortcode('download', async function (path) {

        // Download icon
        const downloadIconSvg = await eleventyConfig.liquid.shortcodes['boxicon'].apply(this, ['file']);

        return '<span class="download">' + 
            downloadIconSvg + '&nbsp;' +
            '<a class="repo-link" title="Download" href="./downloads/' + path + '" target="_blank" rel="noopener">' + 
            path +
            '</a>' +
            '</span>';
    }) ;

};
