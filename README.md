# [Ret's Blog](https://foxdog.blog/)

This is the source code for [Ret](https://furry.engineer/@ret)'s blog - presently hosted at `foxdog.blog`.

## Building

I'm using the excellent [11ty](https://www.11ty.dev/) and the blog is based on the [11ty base blog](https://github.com/11ty/eleventy-base-blog).

Builds are automatic, in [GitHub Actions](.github/workflows/deploy.yml). Content is deployed to Amazon S3 and then served via CloudFront.

You can build locally with:

    npm install
    npm run build

## Plugins & Shortcodes

This section is more to remind myself what is possible...

* Footnotes with `^[Inline]` markdown
* Gnuplot plots with `{% gnuplot 'relative/path/to/script.gp' %}` - outputs a relative path to an SVG, so use with `<img />`
* Graphviz diagrams with `{% graphviz 'relative/path/to/diagram.gv' %}` - outputs a relative path to an SVG, so use with `<img />`

## Contact

If you'd like to talk about anything on my blog, the best way to get in touch with me is on the [Fediverse](https://furry.engineer/@ret) or by emailing `hello` @ the blog domain name.
