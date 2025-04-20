export default (eleventyConfig) => {
    eleventyConfig.addPairedShortcode('note', (children) => `<div class="note">${children}</div>`);
    eleventyConfig.addPairedShortcode('warning', (children) => `<div class="note warning">${children}</div>`);
};