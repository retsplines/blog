import markdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItPrism from 'markdown-it-prism';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItLinkAttributes from 'markdown-it-link-attributes';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import markdownItFootnote from 'markdown-it-footnote';
import markdownitMark from 'markdown-it-mark';
import markdownitAbbr from 'markdown-it-abbr';
import markdownAnchor from "markdown-it-anchor";

export default markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
})
    .use(markdownItAttrs)
    .use(markdownItPrism, {
        defaultLanguage: 'plaintext'
    })
    .use(markdownItAnchor, {
        permalink: markdownAnchor.permalink.linkInsideHeader({
            symbol: '#',
            class: 'anchor-link',
        }),
        level: [2, 3, 4]
    })
    .use(markdownItLinkAttributes, [
        {
            // match external links
            matcher(href) {
                return href.match(/^https?:\/\//);
            },
            attrs: {
                rel: 'noopener',
                target: '_blank'
            }
        }
    ])
    .use(markdownItEmoji)
    .use(markdownItFootnote)
    .use(markdownitMark)
    .use(markdownitAbbr)
    .use(md => {
        md.renderer.rules.image = (tokens, idx) => {

            const token = tokens[idx];
            const src = token.attrGet('src');
            const alt = token.content || '';
            const caption = token.attrGet('title');

            // Collect attributes
            const attributes = token.attrs || [];
            const attributesString = attributes.map(([key, value]) => `${key}="${value}"`).join(' ');
            const imgTag = `<img src="${src}" alt="${alt}" ${attributesString}>`;
            return alt ? `<figure>${imgTag}<figcaption>${alt}</figcaption></figure>` : imgTag;
        };
    });