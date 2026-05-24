# Supported TeX Features

## Inputs

Files may include the content of other files using the `\input{file_name}` command, which will try to find and load
`file_name.tex`. The path in `\input` is relative to the file containing it: for example, if `folder/file.tex` contains
`\input{other}`, then the compiler will read `folder/other.tex` as opposed to `other.tex` from the project root.


## Theorem Environments

By default, the compiler does not recognise any theorem environments. As such, all theorems environments must be
declared as follows:
- `\newtheorem{envname}{Display Name}[parent-counter]`: Declare a new theorem environment with name `envname` and
  display name `Display Name`, which follows a parent counter `parent-counter`. The default counters available are
  `part`, `chapter`, `section`, `subsection`, and `subsubsection.`
- `\newtheorem{envname}[counter]{Display Name}`: Declare a new theorem environment with name `envname` and display name
  `Display Name`, using an existing counter `counter`.

Unlike LaTeX, the compiler does not support theorems creating counters of their own.

For example,
```
\newtheorem{thm}{Theorem}[chapter]
\newtheorem{lem}[thm]{Lemma}
\newtheorem{cor}{Corollary}[thm]
```
will produce theorems numbered as `chapter.1`, `chapter.2`, and so on, which shares the same counter with lemmas.
However, corollaries are numbered by `chapter.theorem.1`, `chapter.theorem.2`, and so on.


## Custom Macros

Custom environments, macros, and definitions **only affect math blocks**, and are **not** expanded by the compiler. 
Since most math blocks are rendered using [MathJax](https://www.mathjax.org/), only a
very limited collection of LaTeX commands are available. 

Macros may be defined using `newcommand` or `renewcommand`.
The compiler will collect all such commands and package them as a preamble for MathJax. Notably, this means that only
the final `renewcommand` will take effect. For example,

```
\newcommand{\hello}{Hi}

\[
\hello
\]

\renewcommand{\hello}{Hello}
\[
\hello
\]
```
will produce two copies of `Hello` as opposed to one `Hi` and one `Hello`.


## Commutative Diagrams


### TikZ

TikZ is supported in a very specific way: blocks of the form

```
\[
\begin{tikzcd}
...
\end{tikzcd}
\]
```

Not all TikZ/quiver functions are supported, due to a lack of `spath3` support by TikZJax.

Using TikZ may dramatically increase the compile time.

### MathJax/XyPic

Alternatively, commutative diagrams may be defined using [amscd](https://www.jmilne.org/not/Mamscd.pdf) or
[XY-pic](https://mirror.quantum5.ca/CTAN/macros/generic/diagrams/xypic/doc/xyguide.pdf).

Thanks to [Manh Tien Nguyen](https://darknmt.github.io/html/index.html), there is a
[visual editor](https://darknmt.github.io/res/xypic-editor/) for XY-pic, which may come in handy.


## Enumerate

Enumerate environments support custom labels and starting indices via their optional argument
```tex
\begin{enumerate}[start=3, label=\alph*\Alph*\roman*]
\item ...
\end{enumerate}
```

A few indexing macro options are available:
- `\alph*` and `\Alph*`: Lower and upper case letters (a, b, c...).
- `\roman*` and `\Roman*`: Lower and upper case Roman numerals (i, ii, iii, ...).
- `\arabic*`: Arabic numbers (1, 2, 3, ...). 


## Packages/Preambles

While specific features of specific packages are occasionally supported by the compiler (which will be stated in this
document), **absolutely no** LaTeX packages are expected to work with this compiler. The only way to add features is
to modify the compiler itself.

Preambles consisting of custom commands may be imported using the `\usepackage{file_name}` command, which will look for
`file_name.sty`. Note that commands such as `NeedsTeXFormat` and `ProvidesPackage` are not recognised at all by the
compiler. As a result, their arguments will show up on the website. As of now, there is no way to prevent this from
happening, so please comment these commands out.



## Bibliography

Bibliography entries should be given in BibTeX, which must be placed in their dedicated `.bib` files, and then imported
using a `\bibliography` macro. Entries not imported this way will be ignored by the bibliography system, and may
interfere with other parts of the document.

Three bibliography styles are supported, which only affect the label of the references (a `\cite[Text]{bibliography}`
will be rendered as [Text, [Label](#)]):
* `plain`: Entries will be numbered alphabetically, and references will be in numbers.
* `alpha`: Entries have the format `Aut78`, where `Aut` is based on the names of the authors, and `78` is the last two digits of the year.
* `raw`: Entries will have the same format as their labels. This format is not supported by standard TeX distributions, and is purely an invention of this system.

For each bibliography entry, there is a custom attribute called `label`, which will overwrite the linked part of each
`\cite` command. For example, under the plain citation style

```bibtex
@book{Book,
    title={Book},
    author={John Book}
}
```

when cited, may be rendered as [Theorem 1, [1](#)]. However, if the reference is declared as
```bibtex
@book{Book,
    title={Book},
    author={John Book},
    label = {Book},
}
```

then it will be rendered as [Theorem 1, [Book](#)].