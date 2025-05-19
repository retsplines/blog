import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig, options) {

    // Places to look for the gnuplot binary
    const searchPaths = options.searchPaths || [
        '/opt/homebrew/bin/',
        '/usr/local/bin/',
        '/usr/bin/',
    ];

    /**
     * Find the renderer binary.
     * @returns {string}
     */
    function findRenderer(binaryName) {

        for (const path of searchPaths) {
            if (fs.existsSync(path + '/' + binaryName)) {
                return path + '/' + binaryName;
            }
        }

        // Otherwise, check if it's in the PATH
        return binaryName;
    }

    /**
     * Process a file using the given arguments.
     * 
     * @returns 
     */
    async function processFile(inputPath, outputDir, args, returnContent) {

        if (returnContent == undefined) {
            returnContent = false;
        }

        // If the input path doesn't exist or isn't a file, return an error
        if (!fs.existsSync(inputPath) || !fs.lstatSync(inputPath).isFile()) {
            console.error(`Could not find script at ${inputPath}`);
            return;
        }

        // Read the file contents
        const scriptContents = fs.readFileSync(inputPath);

        // Compute the hash of the file contents
        const outputName = crypto.hash('sha256', scriptContents, 'hex') + '.svg';

        // Determine the path of the output
        const outputPath = `${outputDir}/${outputName}`;

        // Check if the output file already exists
        if (fs.existsSync(outputPath)) {
            // Return the relative path to the SVG based on the output directory
            return outputName;
        }

        // Otherwise, we need to convert the diagram to SVG
        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Run the renderer binary
        const command = args.join(' ');

        // Run asynchronously
        const execAsync = promisify(exec);
        const result = await execAsync(command);
        
        // Return content directly?
        if (returnContent) {
            return result.stdout;
        }

        // Save the output to the output directory
        fs.writeFileSync(outputPath, result.stdout);

        return outputName;
    }

    /**
     * This shortcode will convert a gnuplot script provided in-line in the template to an SVG image.
     * 
     * Each time it is invoked, we'll compute the hash of the input file to determine if it has changed.
     * 
     * If it has changed, we'll re-run the renderer binary to convert the diagram to SVG and save it to the 
     * output directory which is at the same level as the output file.
     */
    eleventyConfig.addShortcode('gnuplot', async function (relativePath) {

        // Determine the path of the input diagram
        const inputPagePath = this.page.inputPath;
        const inputPageDir = inputPagePath.substring(0, inputPagePath.lastIndexOf('/'));
        const scriptPath = `${inputPageDir}/${relativePath}`;

        // Determine the path of the output directory
        const outputPagePath = this.page.outputPath;
        const outputPageDir = outputPagePath.substring(0, outputPagePath.lastIndexOf('/'));

        // Build a command
        const args = [
            findRenderer('gnuplot'),
            '-c', scriptPath
        ];

        const outputFileName = await processFile(scriptPath, outputPageDir, args);

        // Replace the last part of the stem path with the output file name
        return this.page.filePathStem.substring(0, this.page.filePathStem.lastIndexOf('/')) + '/' + outputFileName;
    });


    /**
     * This shortcode will convert a gnuplot script provided in-line in the template to an SVG image.
     * 
     * Each time it is invoked, we'll compute the hash of the input file to determine if it has changed.
     * 
     * If it has changed, we'll re-run the renderer binary to convert the diagram to SVG and save it to the 
     * output directory which is at the same level as the output file.
     */
    eleventyConfig.addShortcode('graphviz', async function (relativePath) {

        // Determine the path of the input diagram
        const inputPagePath = this.page.inputPath;
        const inputPageDir = inputPagePath.substring(0, inputPagePath.lastIndexOf('/'));
        const scriptPath = `${inputPageDir}/${relativePath}`;

        // Determine the path of the output directory
        const outputPagePath = this.page.outputPath;
        const outputPageDir = outputPagePath.substring(0, outputPagePath.lastIndexOf('/'));

        // Build a command
        const args = [
            findRenderer('dot'),
            '-Tsvg',
            scriptPath
        ];

        const outputFileName = await processFile(scriptPath, outputPageDir, args);

        // Replace the last part of the stem path with the output file name
        return this.page.filePathStem.substring(0, this.page.filePathStem.lastIndexOf('/')) + '/' + outputFileName;
    });

    // Add a shortcode for diagrams
    eleventyConfig.addShortcode('diagram', async function (type, path) {
        const diagramUrl = await eleventyConfig.liquid.shortcodes[type].apply(this, [path]);
        return '<div class="diagram"><img eleventy:ignore src="' + diagramUrl + '" /></div>';
    }) ;

};
