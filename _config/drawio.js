import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

export default function(eleventyConfig, options) {

    const drawioSearchPaths = options.drawioSearchPaths || [
        '/Applications/draw.io.app/Contents/MacOS/draw.io',
        '/usr/local/drawio',
        '/usr/bin/drawio'
    ];

    let cachedDrawIoPath = null;

    /**
     * Find the draw.io binary.
     * @returns {string} The path to the draw.io binary
     */
    function findDrawio() {

        // If we've already found the draw.io binary, return it
        if (cachedDrawIoPath) {
            return cachedDrawIoPath;
        }

        for (const path of drawioSearchPaths) {
            if (fs.existsSync(path)) {
                cachedDrawIoPath = path;
                return path;
            }
        }

        // Otherwise, check if it's in the PATH
        return 'draw.io';
    }

    /**
     * This shortcode will convert a draw.io diagram to SVG.
     * 
     * Each time it is invoked, we'll compute the hash of the input file to determine if it has changed.
     * 
     * If it has changed, we'll re-run the draw.io binary to convert the diagram to SVG and save it to the 
     * output directory which is at the same level as the output file.
     */
    eleventyConfig.addShortcode('drawio', async function(relativePath) {
        
        // Determine the path of the input diagram
        const inputPagePath = this.page.inputPath;
        const inputPageDir = inputPagePath.substring(0, inputPagePath.lastIndexOf('/'));
        const drawioPath = `${inputPageDir}/${relativePath}`;

        // If the input path doesn't exist or isn't a file, return an error
        if (!fs.existsSync(drawioPath) || !fs.lstatSync(drawioPath).isFile()) {
            console.error(`Could not find draw.io diagram at ${drawioPath}`);
            return;
        }

        // Read the file contents
        const drawioContents = fs.readFileSync(drawioPath);

        // Compute the hash of the file contents
        const outputName = crypto.hash('sha256', drawioContents, 'hex') + '.svg';

        // Determine the path of the output
        const outputPagePath = this.page.outputPath;
        const outputPageDir = outputPagePath.substring(0, outputPagePath.lastIndexOf('/'));
        const outputPath = `${outputPageDir}/${outputName}`;

        // Check if the output file already exists
        if (fs.existsSync(outputPath)) {
            // Return the relative path to the SVG based on the output directory
            console.log(`Using cached ${outputName}`);
            return outputName;
        }

        // Otherwise, we need to convert the diagram to SVG
        // Ensure the output directory exists
        if (!fs.existsSync(outputPageDir)) {
            fs.mkdirSync(outputPageDir, { recursive: true });
        }
        
        const drawio = findDrawio();
        console.log(`Converting ${drawioPath} to ${outputPath} using ${drawio}`);
        
        // Build a set of arguments
        const args = [
            drawioPath,
            '-x',
            '-f', 'svg',
            '-o', outputPath
        ];

        // Run the draw.io binary
        const command = `${drawio} ${args.join(' ')}`;
        console.log(`Running command: ${command}`);

        // Run asynchronously
        const execAsync = promisify(exec);
        await execAsync(command);

        return outputName;
    });
};
