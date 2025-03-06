import * as fs from "fs";
import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import EleventyPluginOgImage from 'eleventy-plugin-og-image';
import EleventyPluginBoxicons from 'eleventy-plugin-boxicons';
import pluginFilters from "./_config/filters.js";
import pluginGnuplot from './_config/gnuplot.js';
import footnotes from "eleventy-plugin-footnotes";
import metadata from "./_data/metadata.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {

    // Drafts, see also _data/eleventyDataSchema.js
    eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
        if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
            return false;
        }
    });

    // Copy the contents of the `public` folder to the output folder
    // For example, `./public/css/` ends up in `_site/css/`
    eleventyConfig
        .addPassthroughCopy({
            "./public/": "/"
        })
        .addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");

    // Run Eleventy when these files change:
    // https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

    // Watch images for the image pipeline.
    eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpg,jpeg,gif}");

    // Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
    // Adds the {% css %} paired shortcode
    eleventyConfig.addBundle("css", {
        toFileDirectory: "dist",
    });
    // Adds the {% js %} paired shortcode
    eleventyConfig.addBundle("js", {
        toFileDirectory: "dist",
    });

    // Official plugins
    eleventyConfig.addPlugin(pluginSyntaxHighlight, {
        preAttributes: { tabindex: 0 }
    });
    eleventyConfig.addPlugin(pluginNavigation);
    eleventyConfig.addPlugin(HtmlBasePlugin);
    eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

    eleventyConfig.addPlugin(feedPlugin, {
        type: "atom", // or "rss", "json"
        outputPath: "/feed/feed.xml",
        stylesheet: "pretty-atom-feed.xsl",
        collection: {
            name: "posts",
            limit: 10,
        },
        metadata: {
            language: "en",
            title: metadata.title,
            subtitle: metadata.description,
            base: metadata.url,
            author: {
                name: metadata.author
            }
        }
    });

    // Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
    eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        // Output formats for each image.
        formats: ["avif", "webp", "auto"],

        // widths: ["auto"],

        failOnError: false,
        htmlOptions: {
            imgAttributes: {
                // e.g. <img loading decoding> assigned on the HTML tag will override these values.
                loading: "lazy",
                decoding: "async",
            }
        },

        sharpOptions: {
            animated: true,
        },
    });

    // Open Graph image generation
    eleventyConfig.addPlugin(EleventyPluginOgImage, {
        shortcodeOutput: async (ogImage) =>
            `<meta property="og:image" content="${await ogImage.outputUrl()}" />\n` + 
            // regretfully, some sites still look for this...
            `<meta property="twitter:image" content="${await ogImage.outputUrl()}" />`, 
        satoriOptions: { 
            fonts: [
                {
                    name: 'Inter',
                    data: fs.readFileSync('node_modules/@fontsource/inter/files/inter-latin-500-normal.woff'),
                    weight: 700,
                    style: 'normal',
                },
            ],
        },
    });

    // Footnotes support
    eleventyConfig.addPlugin(footnotes, { 
        baseClass: 'footnote'
    });

    // Boxicons SVG inlining
    eleventyConfig.addPlugin(EleventyPluginBoxicons, {
        classNames: 'boxicon'
    });

    // Gnuplot 
    eleventyConfig.addPlugin(pluginGnuplot);

    // Filters
    eleventyConfig.addPlugin(pluginFilters);
    eleventyConfig.addPlugin(IdAttributePlugin);
    eleventyConfig.addShortcode("currentBuildDate", () => {
        return (new Date()).toISOString();
    });
};

export const config = {
    
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: [
        "md",
        "njk",
        "html",
        "liquid",
        "11ty.js",
    ],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: "njk",

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: "njk",

    // These are all optional:
    dir: {
        input: "content",          // default: "."
        includes: "../_includes",  // default: "_includes" (`input` relative)
        data: "../_data",          // default: "_data" (`input` relative)
        output: "_site"
    },
};
