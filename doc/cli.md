# Spec CLI

## Compile

To compile your project, run
```
npx spec compile
```
in your project directory. To ensure that all tags are recompiled, use
```
npx spec compile --all
```

## Server

To start the server, run
```
npx spec serve
```
which will start a server on `localhost:3000`. To specify a port, use
```
npx spec serve -p <port>
```


## Watch

When writing up a document, it may be convenient to have the server on your computer, and compile the document whenever
a change occurs. Using
```
npx spec watch
```
will start the server and recompile the document automatically when something is changed.

Using
```
npx spec watch --conservative
```

will start the compiler in conservative mode, which causes the following:
- When a change is detected, **only** render the changed file. This will dramatically speed up compile times.
- Render whenever a Tex file is detected to change regardless whether it belongs to a project or not.
- Cause links leaving and entering the file to be broken.
- Break all counters in edited files.

As conservative mode breaks many things, it is best to recompile the project after using it.

### Exit Codes

The following error codes are emitted by the program:

- `41`: Failed to access database.
- `42`: Failed to write to database.
- `43`: Failed to read from database.