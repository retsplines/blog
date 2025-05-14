export default (eleventyConfig) => {
    eleventyConfig.addPairedShortcode('note', (children) => `<div class="note">${children}</div>`);
    eleventyConfig.addPairedShortcode('warning', (children) => `<div class="note warning">${children}</div>`);
    eleventyConfig.addShortcode('diagram', async function (type, path) {
        const diagramUrl = await eleventyConfig.liquid.shortcodes[type].apply(this, [path]);
        return '<div class="diagram"><img eleventy:ignore src="' + diagramUrl + '" /></div>';
    }) ;
};