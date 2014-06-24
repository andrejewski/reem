Reem
====

Reem is a static site generator built for everything. Written in JavaScript, stealing the best ideas from Jekyll, Metalsmith, Middleman, and all the other generators that come before her, Reem is the one generator that can do it all.

## Philosophy
Be realistic to people's needs; specialize to no single use case, but advocate specialization as much as possible.

## Getting Started

### Installation
Reem is available on [npm](https://www.npmjs.org/package/reem) and should be installed globally for the command-line interface.

```bash
npm -g install reem
```

### Initialization
In a chosen static site directory run:

```bash
reem --init
```

Which creates the default folder/file structure:

```
|- layout/
|- output/
|- source/
|- reemfile.js
```

The layout directory contains the templates, includes, and other rendering files. The source directory contain posts, assets, directories, and any other files. The output directory contains, well, the output.

The `reemfile.js` is where Reem can be configured; changing defaults, overriding the default folder structure, and modifying Reem's behavior can all done within this JavaScript file.

### Building
The command for building the source directory and writing to the output directory is plainly:

```bash
reem
```

### Adventure Time!
Reem is a complex beast of unimaginable flexibility, performance, and developer joy. Now that you have her by your side and know how to fight with her, please sit down and read.

## Reading

- [Introducing Reem](http://chrisandrejewski.com/paper/reem/introducing-reem.html), A Philosophy and Features Brief
- [Creating a Static Markdown Website](http://chrisandrejewski.com/paper/reem/markdown-site.html), Beginner Tutorial
- [Superusing the CLI](http://chrisandrejewski.com/paper/reem/superusing-cli.html), Reem's Command-line Guide
- [Developing a Great Reem Plugin](http://chrisandrejewski.com/paper/reem/plugin-crafting.html), Best Practices and Good Manners

## Plugins

- [`reem-coffee`](https://github.com/andrejewski/reem-coffee) compiles CoffeeScript files to JavaScript and supports source maps. 
- [`reem-draft`](https://github.com/andrejewski/reem-draft) hides unfinished posts from production builds.
- [`reem-flow`](https://github.com/andrejewski/reem-flow) provides control structures for adding plugins to Reem.
- [`reem-markdown`](https://github.com/andrejewski/reem-markdown) converts Markdown to HTML.

More Reem plugins can be found on [npm](https://www.npmjs.org/search?q=reem-plugin).

## Contributing
Reem is a relatively new static site generator. To ensure the community their plugins will not potential break every day, Reem will strive to keep any and all changes backwards-compatible until the ^1.0.0 release. So basically, v0 is being treated like v1.

Contributions are incredibly welcome. If you find an bug, open an issue. Feature requests are also welcome, but considering making a standalone plugin first. Any pull requests must pass the tests found in `test/`; if the pull does not pass, please explain why.

```bash
# running tests
npm run test
npm run test-spec
```

