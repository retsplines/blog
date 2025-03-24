import { DateTime } from "luxon";
import Image from "@11ty/eleventy-img";
import fs from 'fs';

export default function(eleventyConfig) {
    eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
        // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
        return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
    });

    eleventyConfig.addFilter("htmlDateString", (dateObj) => {
        // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
        return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
    });

    // Get the first `n` elements of a collection.
    eleventyConfig.addFilter("head", (array, n) => {
        if(!Array.isArray(array) || array.length === 0) {
            return [];
        }
        if( n < 0 ) {
            return array.slice(n);
        }

        return array.slice(0, n);
    });

    // Return the smallest number argument
    eleventyConfig.addFilter("min", (...numbers) => {
        return Math.min.apply(null, numbers);
    });

    // Return the keys used in an object
    eleventyConfig.addFilter("getKeys", target => {
        return Object.keys(target);
    });

    eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
        return (tags || []).filter(tag => ["all", "posts"].indexOf(tag) === -1);
    });

    eleventyConfig.addFilter("sortAlphabetically", strings =>
        (strings || []).sort((b, a) => b.localeCompare(a))
    );

    eleventyConfig.addFilter("imageDataUrl", async function(image) {
        
        // Get the base path of the inputPath
        let inputPagePath = this.page.inputPath;
        let inputPageDir = inputPagePath.substring(0, inputPagePath.lastIndexOf('/'));

        // Replace relative prefix
        if (image.startsWith('./')) {
            image = image.replace('./', '');
        }

        let imagePath = `${inputPageDir}/${image}`;

        // Resize the image first
        let result = await Image(imagePath, {
            outputDir: './_site/img/',
            widths: ['1200'],
            formats: ['jpg'],
            sharpJpegOptions: {
                quality: 20,
                progressive: true,
            },
        });
        
        console.log(result);
        let jpeg = result.jpeg[0].outputPath;

        // Read the output data
        let data = fs.readFileSync(jpeg);
        let base64 = Buffer.from(data).toString('base64');

        // Return a data URL
        return `data:image/jpeg;base64,${base64}`;
    });
};
