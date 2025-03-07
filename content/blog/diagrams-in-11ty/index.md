---
title: Diagrams in 11ty with Draw.io
description: A simple way to add visually-editable diagrams to an 11ty post
tags: [meta, 11ty]
---

Test of embedded Graphviz diagrams and Gnuplot charts in 11ty.

<img eleventy:ignore style="width: 500px" src="{% gnuplot 'diagrams/test.gp' %}" />

<img eleventy:ignore style="width: 500px" src="{% graphviz 'diagrams/test.gv' %}" />