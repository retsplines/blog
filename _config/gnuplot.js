export default function(eleventyConfig) {

    eleventyConfig.addPairedShortcode("gnuplot", function(content) { 
        
        // Invoke gnuplot
        console.log(content);
        return 'awoo';

    });

};
