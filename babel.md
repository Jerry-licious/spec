# The Babel Config

In `src/db`, decorators are placed on model fields to include additional metadata. 
This works well for the compiler, but not the website, since it is built using Vite. 
Since Vite by itself does not recognise these decorators, Babel is used, 
alongside a few plugins, to transform them. 

However, Babel by default does not work with `tsx` files. For simplicity and to localise 
its interference with the rest of the project, Babel will only process files in the `db` directory. 
