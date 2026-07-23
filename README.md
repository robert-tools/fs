# @robert.tools/fs

A package to provide tooling for interactions with the file system.

## Installation

```bash
npm install @robert.tools/fs
```


## Troubleshooting

### FS.readFile
This function returns `string | object | undefined` depending on the file content.
If you know the exact return type, you can type case it to avoid issues with TypeScript.

```ts
const json = FS.readFile('path/to/file.json') as object;
const str = FS.readFile('path/to/file.txt') as string;
```