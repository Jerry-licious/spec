# Spec

![Pack](https://github.com/Jerry-licious/spec/actions/workflows/pack.yml/badge.svg)


Spec is a limited latex to website compiler heavily inspired by [Gerby](https://gerby-project.github.io/), 
offering an online tag-based view for a LaTeX document. Each part/chapter/section/theorem is assigned a unique _tag_ 
associated to its label, and each tag gets its own webpage. 


## Acknowledgements

- [Gerby](https://gerby-project.github.io/) and the [Stacks Project](https://stacks.math.columbia.edu/): I took the idea of 
organising a large document under tags and presenting it as a website from this system. Originally, I intended on using
Gerby directly to compile my own notes, and adjusted it slightly for my own purposes. Eventually, the desire for some
additional features, faster compile times, and a lack of understanding of Gerby prompted me to
start this project. In the development of this project, I copied the layout of pages and styling of certain elements from Gerby. So needless 
to say, this project would not be possible without it.
- [Unified JS](https://unifiedjs.com/), [Unified LaTeX](https://github.com/siefkenj/unified-latex), and 
[hast](https://github.com/siefkenj/unified-latex): The compiler uses Unified LaTeX to parse LaTeX source code, runs 
multiple passes through the syntax tree to gather and create metadata, and output HTML.
- [MathJax](https://www.mathjax.org/) and [XyJax](https://github.com/sonoisa/XyJax-v3): All math on the website are 
rendered using MathJax. XyJax provides support for commutative diagrams. 
- [TikZJax](https://tikzjax.com/) and [Node TikZJax](https://github.com/prinsss/node-tikzjax): TikzJax provides support
for commutative diagrams.


# Setup

The project depends on [NodeJS](https://nodejs.org/en/download) v22 or above and `npm` v10 or above. 

Visit the [Releases](https://github.com/Jerry-licious/spec/releases) page to download the newest version of the package,
which should be named something like `spec-<version>.tgz`. Once the project has been downloaded, run
```
npm install -g ./spec-<version>.tgz
```


# Usage

- [CLI](./doc/cli.md)
- [Config](./doc/config.md)
- [Supported Tex Features](./doc/tex.md)
- [Comments](./doc/comments.md)



# Roadmap

The following are features that I am _considering_ to add to the project in the future, which may not be implemented 
due to reasons ranging from being occupied to being incompetent. 

- Server side MathJax rendering option.
- Better parasitic links in MathJax. 
- Better SVG colour scaling. 
- Leaf entries can expand in the table of contents. 
- Omit division types in deeply nested sections. 