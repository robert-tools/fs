/**
 * 🧩 types for FS
 * @module backend/_shared/FS
 * @version 1.3.0
 * @date 2026-08-08
 * @license MIT
 * @author Robert Willemelis <github.com/willi84>
 */
export type Filetype = 'file' | 'folder' | 'symlink' | 'other';
export type FileItem = { type: Filetype; path: string };
export type FileItems = FileItem[];
export type $FileResult = string | object | undefined;
