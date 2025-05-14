---
title: Test Page
description: A perpetual draft page that serves to make sure Ret hasn't broken any blog features
date: 2025-05-14
draft: true
tags: ['test', 'meta']
accent: '#446f88'
---

**Lorem ipsum dolor sit amet^[This is actually quite a famous bit of text that has been adopted by designers as a placeholder for real content.], consectetur adipiscing elit. Aenean commodo congue ipsum, consectetur eleifend magna egestas in. Nullam sed arcu eu purus iaculis sagittis. Praesent interdum lacus et justo mollis porttitor.**

# Header 2

*Curabitur lobortis*, ~~purus a ultricies~~ volutpat, justo lacus molestie urna, eu lacinia felis nisi eget massa. Pellentesque vitae viverra tortor. Nullam consequat posuere metus ac congue. Praesent eros dolor, interdum ac porttitor quis, lacinia nec erat. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse volutpat tellus in lectus semper, at feugiat purus pretium.

* An unordered list of items
* That can be simple like this
* Or have child items 
    * Like this
        * ...and this.

## Header 3

Integer nec neque accumsan, dignissim felis et, tincidunt urna. Vivamus massa dolor, mollis sed pellentesque quis, egestas non erat. Morbi aliquet ligula non neque pharetra, sit amet placerat nisl luctus. Maecenas non dictum ipsum, nec bibendum mauris. Morbi sit amet libero non odio tristique rhoncus id eget enim.

1. An ordered list of items ^[Lists are also perfectly capable of containing footnote references!]
2. That can be simple like this
3. Or have child items
    1. Like this
        1. ...and this.

### Header 4 - Gnuplot

Underneath, there should be a `gnuplot` diagram.

{% diagram 'gnuplot', 'surface.gp' %}

# Header 4 - Graphviz

Underneath, there should be a `graphviz` `dot` diagram.

{% diagram 'graphviz', 'graph.dot' %}

### Header 5 - Some PHP Code

```php
<?php
class Foo {
    function __clone() {
        clone($this);
    }
}

$x = new Foo;

// Remember this old chestnut?
clone($x);
```

### Another Latin Paragraph

Integer nec neque accumsan, dignissim felis et, tincidunt urna. Vivamus massa dolor, mollis sed pellentesque quis, egestas non erat. Morbi aliquet ligula non neque pharetra, sit amet placerat nisl luctus. Maecenas non dictum ipsum, nec bibendum mauris. Morbi sit amet libero non odio tristique rhoncus id eget enim.
