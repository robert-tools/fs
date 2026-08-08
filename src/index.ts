/**
 * 🎯 A utility class for file system operations, providing methods to manage files and directories.
 * @module backend/_shared/FS
 * @example FS.createFolder('./data');
 * @version 1.3.0
 * @date 2026-08-08
 * @license MIT
 * @author Robert Willemelis <github.com/willi84>
 */

import * as fs from 'fs';
import * as path from 'path';
import { CI, LOG } from '@robert.tools/log';
import type { FileItem, FileItems } from './index.d';

export enum Status {
    ERROR = -1,
    REMOVED = 0,
    CREATED = 1,
    ALREADY_EXISTS = 2,
    NOT_EXISTS = 3,
    NOT_EMPTY = 4,
    OVERWRITTEN = 5,
    EXTENDED = 6,
    NO_CHANGES = 7,
}

// https://stackoverflow.com/a/54387221
const readFilesRecursively = (
    dir: string,
    fileList: FileItem[],
    recursive: boolean,
    blacklist: string[] = []
): FileItem[] => {
    const IGNORE = blacklist
        .map((item) => item.trim()) // Trim whitespace from blacklist items
        .map((item) => item.replace(/\\/g, '/')) // Normalize blacklist paths to use forward slashes
        .map((item) => (item.endsWith('/') ? item : item + '/')) // Ensure all paths end with a slash
        .map((item) => item.replace(/\/$/, '')) // Remove trailing slash for comparison
        .map((item) => item.replace(/^\//, '')); // Remove leading slash for comparison
    const files = fs.readdirSync(dir);
    files.forEach((file: string) => {
        const filePath = path.join(dir, file);
        if (IGNORE.includes(file)) {
            return;
        }
        if (fs.statSync(filePath).isDirectory()) {
            if (recursive === true) {
                readFilesRecursively(filePath, fileList, recursive, IGNORE);
                fileList.push({ path: filePath, type: 'folder' });
            }
        } else {
            fileList.push({ path: filePath, type: 'file' });
        }
    });
    return fileList;
};

const move = (oldPath: string, newPath: string, type: string): void => {
    if (!FS.hasFolder(oldPath)) {
        LOG.WARN(`Old ${type} does not exist: ${oldPath}`);
        return;
    }
    const newFolder = FS.getFolder(newPath);
    if (!FS.hasFolder(newFolder)) {
        FS.createFolder(newFolder);
    }
    fs.renameSync(oldPath, newPath);
};

export class FS {
    /**
     * 🎯 Checks if a file or folder exists at the specified path.
     * @param {string} path ➡️ The path to check for existence.
     * @returns {boolean} 📤 True if the file or folder exists, false otherwise.
     */
    static exists = (path: string): boolean => {
        return fs.existsSync(path);
    };
    /**
     * 🎯 Checks if a folder exists at the specified path.
     * @see FS.exists alias for consistency
     * @param {string} folder ➡️ The path to check for existence.
     * @returns {boolean} 📤 True if the folder exists, false otherwise.
     */
    static hasFolder = FS.exists;

    /**
     * 🎯 Checks if a file exists at the specified path.
     * @see FS.exists alias for consistency
     * @param {string} file ➡️ The path to check for existence.
     * @returns {boolean} 📤 True if the file exists, false otherwise.
     */
    static hasFile = FS.exists;

    /**
     * 🎯 Extracts the file name from a given file path.
     * @todo Handle files without extensions
     * @param {string} filePath ➡️ The full path of the file.
     * @returns {string} 📤 The file name extracted from the path or ''
     */
    static getFileName = (filePath: string): string => {
        const parts = filePath.split('/');
        const filename = parts[parts.length - 1];
        const isFile = FS.isFile(filePath);
        if (isFile) {
            return filename;
        }
        return ''; // no file
    };

    /**
     * 🎯 Creates a folder at the specified path if it does not already exist.
     * @param {string} folder ➡️ The path of the folder to create.
     * @returns {void}
     */
    static createFolder(folder: string) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    }

    /**
     * 🎯 Removes a folder and all its contents if it exists.
     * @param {string} folder ➡️ The path of the folder to remove.
     * @returns {void}
     */
    static removeFolder(folder: string): void {
        if (fs.existsSync(folder)) {
            fs.rmSync(folder, { recursive: true, force: true });
        }
    }

    /**
     * 🎯 Checks if the given path is a file.
     * @param {string} file ➡️ The path to check.
     * @returns {boolean} 📤 True if the path is a file, false otherwise.
     */
    static isFile(file: string): boolean {
        const isFile = FS.exists(file) && fs.statSync(file).isFile();
        if (isFile) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 🎯 Checks if the given path is a folder.
     * @param {string} folder ➡️ The path to check.
     * @returns {boolean} 📤 True if the path is a folder, false otherwise.
     */
    static isFolder(folder: string): boolean {
        const isFolder = FS.exists(folder) && fs.statSync(folder).isDirectory();
        if (isFolder) {
            return true;
        } else {
            return false;
        }
    }
    /**
     * 🎯 Extracts the folder path from a given file path.
     * @param {string} file ➡️ The full path of the file.
     * @returns {string} 📤 The folder path extracted from the file path.
     */
    static getFolder(file: string): string {
        const parts = file.split('/');
        const isFile = FS.isFile(file);
        if (isFile) {
            const filename = parts[parts.length - 1];
            const replaceable = filename.indexOf('.') !== -1 ? filename : '';
            const folder = file.replace(replaceable, '');
            return folder.replace(/\/$/, ''); // Remove trailing slash if exists
        } else if (FS.isFolder(file)) {
            return file.replace(/\/$/, ''); // Remove trailing slash if exists
        } else {
            const isFilePath = parts[parts.length - 1].indexOf('.') !== -1;
            let result = file;
            if (isFilePath) {
                const filename = parts[parts.length - 1];
                result = file.replace(filename, '');
            }
            return result.replace(/\/$/, ''); // Remove trailing slash if exists
        }
    }

    /**
     * 🎯 Extracts the first folder from a given file path.
     * @param {string} file ➡️ The full path of the file.
     * @returns {string} 📤 The first folder extracted from the file path.
     */
    static getFirstFolder(file: string) {
        const folder = FS.getFolder(file);
        const folderParts = folder.split('/').filter((name) => name !== '');
        return folderParts.length > 0 ? folderParts[0] : '';
    }

    /**
     * 🎯 Moves a folder from an old path to a new path, creating the new folder if it does not exist.
     * @see move alias for consistency
     * @param {string} oldFolder ➡️ The current path of the folder to move.
     * @param {string} newFolder ➡️ The new path where the folder should be moved.
     * @returns {void}
     */
    static moveFolder = (oldFolder: string, newFolder: string): void => {
        move(oldFolder, newFolder, 'folder');
    };

    /**
     * 🎯 Moves a file from an old path to a new path, creating the new folder if it does not exist.
     * @see move alias for consistency
     * @param {string} oldFile ➡️ The current path of the file to move.
     * @param {string} newFile ➡️ The new path where the file should be moved.
     * @returns {void}
     */
    static moveFile = (oldFile: string, newFile: string): void => {
        move(oldFile, newFile, 'file');
    };

    /**
     * 🎯 Moves a file or folder from an old path to a new path, creating the new folder if it does not exist.
     * @param {string} oldPath ➡️ The current path of the file or folder to move.
     * @param {string} newPath ➡️ The new path where the file or folder should be moved.
     * @returns {void}
     */
    static move = (oldPath: string, newPath: string): void => {
        move(oldPath, newPath, 'path');
    };

    /**
     * 🎯 Renames a file or folder from an old path to a new path, creating the new folder if it does not exist
     * @see move alias for consistency
     * @param {string} oldPath ➡️ The current path of the file or folder to rename.
     * @param {string} newPath ➡️ The new path where the file or folder should be renamed.
     * @returns {void}
     */
    static rename = (oldPath: string, newPath: string): void => {
        move(oldPath, newPath, 'path');
    };

    /**
     * 🎯 Reads the content of a file at the specified path.
     * @param {string} path
     * @param opts ➡️ Options for reading the file. Supported options:
     *                  - encoding: The encoding to use (default is 'utf8').
     *                  - returnType: 'string' (default) returns the content as a string, 'json' parses the content as JSON.
     * @returns {string | object | undefined} 📤 The content of the file as a string or parsed JSON object.
     */
    static readFile(path: string, opts: any = {}): string | object | undefined {
        let data;
        opts['encoding'] = 'utf8';

        try {
            const isJSON = path.indexOf('.json') !== -1;
            const fileStream = fs.readFileSync(path);
            const returnType = opts['returnType'] ?? 'string';
            // const noFixJSON = options['noFixJSON'] ?? false;
            const str = fileStream.toString();
            if (isJSON) {
                if (returnType === 'json') {
                    data = JSON.parse(str);
                } else {
                    data = str; // default to string
                }
            } else {
                data = str;
            }
        } catch (error: any) {
            LOG.FAIL(`[${CI('FS')}] readFile: ${error}`);
        }
        return data;
    }

    /**
     * 🎯 Reads the content of a JSON file.
     * @param {string} path
     * @param options ➡️ Options for reading the file.
     * @returns {string | object | undefined} 📤 The content of the file as a string or parsed JSON object.
     */
    static readJSON(path: string, opts: any = {}): object {
        const options = { ...opts, returnType: 'json' };
        const data = FS.readFile(path, options);
        if (!data) {
            return { error: `File not found: ${path}` };
        }
        return data as object;
    }

    /**
     * 🎯 Writes data to a file at the specified path, creating the directory if it does not exist.
     * @todo Stabilize the createDirectory = false option
     * @todo make options more flexible with object
     * @param {string} path ➡️ The full path of the file to write.
     * @param {string | object} rawData ➡️ The data to write to the file. Can be a string or an object (which will be stringified).
     * @param {string} option ➡️ The write option. Supported options:
     *                          - 'replace' (default): Replaces the existing content.
     *                          - 'attach': Appends to the existing content.
     * @param {boolean} createDirectory - If true (default), creates the directory if it does not exist.
     * @returns {void}
     */
    static writeFile(
        path: string,
        rawData: string | object,
        option = 'replace',
        createDirectory = true
    ) {
        const folder = FS.getFolder(path);

        const data: string =
            typeof rawData === 'string'
                ? rawData
                : JSON.stringify(rawData, null, 4);
        const options = option === 'attach' ? { flag: 'a+' } : {}; // , { flag: 'wx' }
        if (createDirectory) {
            if (!FS.hasFolder(folder)) {
                FS.createFolder(folder);
            }
            fs.writeFileSync(path, data, options);
        } else {
            // TODO: stabilize
            if (FS.hasFolder(folder)) {
                LOG.WARN(`Folder already exists: ${folder}`);
                fs.writeFileSync(path, data, options);
            }
        }
    }

    /**
     * 🎯 Removes a file at the specified path if it exists.
     * @param {string} filePath ➡️ The full path of the file to remove.
     * @returns {void}
     */
    static removeFile(filePath: string): void {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    /**
     * 🎯 Lists files in a specified directory, with options for recursion and full path display.
     * @param {string} path ➡️ The directory path to list files from.
     * @param {boolean} recursive ➡️ If true, lists files recursively from subdirectories (default is true).
     * @param {boolean} fullPath ➡️ If true, returns full file paths; if false, returns only file names (default is true).
     * @param {string[]} blacklist ➡️ An array of file or folder names to exclude from the listing (default is an empty array).
     * @returns {string[]} 📤 An array of file paths or names, depending on the fullPath option.
     */
    static list(
        path: string,
        recursive = true,
        fullPath = true,
        blacklist: string[] = []
    ): string[] {
        if (!fs.existsSync(path)) {
            LOG.WARN(`[${CI('FS')}] Path ${path} does not exist.`);
            return [];
        }
        let result: string[] = readFilesRecursively(
            path,
            [],
            recursive,
            blacklist
        )
            .filter((file: FileItem) => file.type === 'file')
            .map((file: FileItem) =>
                fullPath ? file.path : FS.getFileName(file.path)
            );
        return result;
    }

    /**
     * 🎯 Lists files in a specified directory, with options for recursion.
     * @param {string} path ➡️ The directory path to list files from.
     * @param {boolean} recursive ➡️ If true, lists files recursively from subdirectories (default is true).
     * @param {string[]} blacklist ➡️ An array of file or folder names to exclude from the listing (default is an empty array).
     * @returns {FileItems} 📤 An array of FileItem objects containing file paths and types.
     * @note This method returns detailed file information, including both files and folders.
     */
    static listDetails(
        path: string,
        recursive = true,
        blacklist: string[] = []
    ): FileItems {
        if (!fs.existsSync(path)) {
            LOG.WARN(`[${CI('FS')}] Path ${path} does not exist.`);
            return [];
        }
        let result: FileItems = readFilesRecursively(
            path,
            [],
            recursive,
            blacklist
        );

        return result;
    }

    /**
     * 🎯 Calculates the size of the given content.
     * @param {string | object} content ➡️ The content to calculate the size of.
     * @returns {number} 📤 The size of the content in bytes.
     */
    static sizeContent(value: string | object): number {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        const size = Buffer.from(value).length;
        return size;
    }

    /**
     * 🎯 Calculates the size of a file at the specified path.
     * @todo handle object content of readFile
     * @param {string} file ➡️ The full path of the file.
     * @returns {number} 📤 The size of the file in bytes. Returns 0 if the file does not exist.
     */
    static size(file: string): number {
        const content = FS.readFile(file, { noFixJSON: true }) || '';
        return FS.sizeContent(content);
    }
}
