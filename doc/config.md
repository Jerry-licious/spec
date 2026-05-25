# Config File

When compiling a project, the software will look for `spec.toml` in the current directory.
A default config file will be created when the project is first ran, which should look something like this:

```toml
database = "spec.db"
document = "document.tex"
siteTitle = "Unnamed Website"

[compiler]
compileAll = false
redoTags = false
indirectReferences = true

[website]
font = "cmu-serif"
fontSize = 16
lineHeight = 1.3
textAlign = "left"
lineWidth = 45

primaryColour = "blue"
neutralColour = "grey"

searchLimit = 16
maxSearchPages = 48

recentChanges = 10
tableOfContentsDepth = 2

hoverPreview = true

displayComments = true
allowComments = true

advertiseSpec = true
```

## Shared Config Fields

- `database`: Location of the sqlite database file used by the project.
- `document`: Entry point of the LaTeX document.
- `siteTitle`: Title of the website, used for page titles and as a header for the main page.


## Compiler Config Fields

- `compileAll`: Whether to compile every tag whenever the compiler is ran. If set to `false`, the compiler will
  recognise existing labelled tags that have not been changed, and avoid rendering them again. Currently, setting
  `compileAll` to `true` should not significantly slow down the  However, more features in the future may change
  this.
- `redoTags`: If set to `true`, will **delete all existing tags** and assign new tags to every
  part/chapter/section/theorem/etc. This will break all existing links going into the website. Please consider taking a
  backup of the database file before doing this.
- `indirectReferences`: If set to `true`, will compute for each page the list of all pages it indirectly refers
  to. May slow down the compiler significantly when there is a large number of tags.


## Website Configs

- `font`: The main font used on the website. Must be one of `roboto`
  ([Roboto](https://fontsource.org/fonts/roboto)), `open-sans` ([Open Sans](https://fontsource.org/fonts/open-sans)),
  `cmu-serif` ([CMU Serif](https://fontlibrary.org/en/font/cmu-serif), default serif font in LaTeX), and
  `cmu-sans-serif` ([CMU Sans Serif](https://fontlibrary.org/en/font/cmu-sans-serif)).
- `fontSize`: Size of text in content blocks, in `px`.
- `lineHeight`: Height of each line.
- `textAlign`: Alignment of context texts. Must be one of `left`, `center`, `right`, `justify`.
- `lineWidth`: Width of the main content block, in `rem` (which scales with font size).


- `primaryColour`: Used to colour links and buttons. Must be one of `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`,
  `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, and `rose`.
- `neutralColour`: Used to colour background, lines, and shade elements. Must be one of `slate`, `grey`, `zinc`,
  `stone`. These colours can hardly be distinguished in light mode, but are more different in dark mode.


- `searchLimit`: Maximum amount of search results to display per page.
- `maxSearchPages`: Maximum number of pages for searches.


- `recentChanges`: The number of recent changes to show on the sidebar of the main page. If set to `0`, the recent changes section will never show up.


- `tableOfContentsDepth`: How many additional layers to display in the table of contents. For example, setting it to `1` will display all chapters on the main page, setting it to `2` will display all sections on the main page, and so on.
- `tableOfContentsUnfoldDepth`: Layers behind this number will start off folded in the table of contents. 
- `tableOfContentsShortDepth`: Layers behind this number will omit their name (section/subsection/etc) in the table of
contents. 


- `hoverPreview`: When hovering links, preview the target.
- `copyLabelButton`: Add a button next to theorems to copy their label.


- `displayComments`: Display comments under each unit.
- `allowComments`: Allow visitors to put down comments.


- `advertiseSpec`: Attribute spec in the sidebar.

The colour scheme is taken from [Tailwind](https://tailwindcss.com/docs/colors), thanks
to [HTML Colour Codes](https://htmlcolorcodes.com/color-chart/tailwind-color-chart/). The `grey` here refers to the
`neutral` in Tailwind.

To use a favicon, place the icon under `public/favicon.ico`. 

