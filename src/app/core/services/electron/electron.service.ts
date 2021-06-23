import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, dialog } from 'electron';
import * as remote from '@electron/remote';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Song } from "../../../models/song.model";
import { v4 as uuidv4 } from 'uuid';
const nodePath = window.require('path');

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  dialog: typeof dialog;
  childProcess: typeof childProcess;
  fs: typeof fs;
  mm: any; // music-metadata

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.dialog = window.require('electron').dialog;
      this.remote = window.require('electron').remote;
      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
      this.mm = this.remote.require('music-metadata');
    }
  }

  public async selectFiles(): Promise<Song[]> {
    const selection = await this.remote.dialog.showOpenDialog(
      this.remote.getCurrentWindow(),
      {properties: ['openFile', 'multiSelections']}
    );

    return await Promise.all(selection.filePaths.map(async path => {
      return await this.readFile(path);
    }));
  }

  public readFile(path: string): Promise<Song> {
    return Promise.all([
      Promise.resolve(nodePath.basename(path)),
      this.mm.parseFile(path, { duration: true, skipCovers: false })
    ]).then(([name, stat]) => {
      const songName = stat.common.title || name;
      const author = stat.common.artist || 'Unknown';

      return new Song({
        id: uuidv4(),
        name: songName,
        author,
        path,
        duration: Math.ceil(stat.format.duration)
      });
    });
  }

  public read(path: string) {
    return new Promise((res, rej) => {
      this.fs.readFile(path, null, (err, file) => {
        if (err) {
          return rej(err);
        }

        res(file.buffer);
      });
    });
  }
}
