# Spec


# TODO

- ~~Proper style classes.~~
- ~~Blocks/chapters/sections should link to themselves when rendered.~~
- ~~Thin scrollbars.~~ 
- Better 404 pages. 
- Custom proof texts 
- Custom QED
- External links with \hyperref.
- ~~Thin resolution sidebar.~~
- ~~Omit empty paragraphs from render.~~
- ~~Proper preamble collection~~
- ~~Have a special collector that gets the main page.~~
- ~~Citations~~
  - ~~Partial BibTeX support~~
  - ~~Cite commands~~
  - ~~Custom bibliography reference text.~~
  - ~~Citation Pages~~
  - ~~Distinguished URL row.~~


# Exit Code

- 41: Failed to access database.
- 42: Failed to write to database.
- 43: Failed to read from database. 


# Bibliography

Bibliography entries should be given in BibTeX, which must be placed in their dedicated `.bib` files, and then imported
using a `\bibliography` macro. Entries not imported this way will be ignored by the bibliography system, and may 
interfere with other parts of the document. 

Three bibliography styles are supported, which only affect the style of the references:
* `plain`: Entries will be numbered alphabetically, and references will be in numbers.
* `alpha`: Entries have the format `Aut78`, where `Aut` is based on the names of the authors, and `78` is the last two digits of the year. 
* `raw`: Entries will have the same format as their labels. This format is not supported by standard TeX distributions, and is purely an invention of this system. 

For each bibliography entry, there is a custom attribute called `label`, which will overwrite the linked part of each 
`\cite` command. 

