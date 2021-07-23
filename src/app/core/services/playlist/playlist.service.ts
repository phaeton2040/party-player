import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Playlist } from '../../../models/playlist.interface';
import { ElectronService } from '../electron/electron.service';
import { PlayerIndex } from '../player/player.service';
import { Song } from "../../../models/song.model";
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

export interface PlaybackSettings {
  randomize?: boolean;
  straight?: boolean;
  sequential?: {
    songsPerPlaylist: number
  }
}

// TODO: persist playlist and settings to local storage with another service instead of calling local storage directly
// TODO: move history to a separate service

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  public settings: PlaybackSettings = {
    randomize: false,
    straight: true,
    sequential: {
      songsPerPlaylist: 2
    }
  };

  private playlists: BehaviorSubject<Playlist[]> = new BehaviorSubject<Playlist[]>([]);
  private onRemoveSong: Subject<PlayerIndex> = new Subject<PlayerIndex>();
  private onMoveSong: Subject<void> = new Subject<void>();

  public get playlists$(): Observable<Playlist[]> {
    return this.playlists.asObservable();
  }

  public get onRemoveSong$(): Observable<PlayerIndex> {
    return this.onRemoveSong.asObservable();
  }

  public get onMoveSong$(): Observable<void> {
    return this.onMoveSong.asObservable();
  }

  constructor(private electron: ElectronService) {
    const storedSettings = localStorage.getItem('settings');

    if (storedSettings) {
      this.settings = JSON.parse(storedSettings);
    } else {
      // store default settings
      localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    const storedPlaylistsJson = localStorage.getItem('playlists');

    if (storedPlaylistsJson) {
      const storedPlaylists = JSON.parse(storedPlaylistsJson);

      this.playlists.next(
        storedPlaylists.map((storedPlaylist: Playlist) => {
          storedPlaylist.songs = storedPlaylist.songs.map(s => new Song(s));
          return storedPlaylist;
        })
      );
    }
  }

  public setSettings(s: Partial<PlaybackSettings>): void {
    this.resetHistory();
    this.settings = { ...this.settings, ...s };
    localStorage.setItem('settings', JSON.stringify(this.settings));
  }

  public addPlaylist(pl: Playlist): void {
    const currPlaylists = this.playlists.value;

    currPlaylists.push(pl);

    localStorage.setItem('playlists', JSON.stringify(currPlaylists));
    this.playlists.next(currPlaylists);
  }

  public removePlaylist(name: string): void {
    const currPlaylists = this.playlists.value;
    const newPLaylists = currPlaylists.filter((pl) => pl.name !== name);

    localStorage.setItem('playlists', JSON.stringify(newPLaylists));
    this.playlists.next(newPLaylists);
  }

  public async addSongs(playlistName: string, filePaths?: string[]): Promise<void> {
    const currPlaylists = this.playlists.value;
    const playlist = currPlaylists.find((pl) => pl.name === playlistName);
    let songs;

    try {
      if (filePaths) {
        songs = await this.electron.generateSongsFromPaths(filePaths);
      } else {
        songs = await this.electron.selectFiles();
      }
    } catch (err) {
      console.log('Error while loading songs:', err);
      return;
    }

    playlist.songs = playlist.songs.concat(songs);

    localStorage.setItem('playlists', JSON.stringify(currPlaylists));
    this.playlists.next(currPlaylists);
  }

  removeSong(index: PlayerIndex): void {
    const pls = this.playlists.value;
    const pl = pls[index.playlistIndex];

    pl.songs.splice(index.songIndex, 1);

    localStorage.setItem('playlists', JSON.stringify(pls));
    this.playlists.next(pls);
    this.onRemoveSong.next(index);

    // reduce index in playlist history by 1
    const currPlaylistHistory = this.history[index.playlistIndex];

    if (this.currentSeq[this.currentSeq.length - 1] > index.songIndex) {
      currPlaylistHistory[currPlaylistHistory.length - 1]--;
      this.currentSeq[this.currentSeq.length - 1]--;
    }
  }

  public history = {};
  public currentSeq = [];

  public getNextSong(playerIndex: PlayerIndex): PlayerIndex {
    if (!this.history[playerIndex.playlistIndex]) {
      this.history[playerIndex.playlistIndex] = [];
    }

    if (!this.settings.straight) {
      if (this.currentSeq.length >= this.settings.sequential.songsPerPlaylist) {
        playerIndex.playlistIndex = (playerIndex.playlistIndex + 1) < this.playlists.value.length ?
          playerIndex.playlistIndex + 1 : 0;

        if (!this.history[playerIndex.playlistIndex]) {
          this.history[playerIndex.playlistIndex] = [];
        }

        const currPlaylistHistory = this.history[playerIndex.playlistIndex];

        playerIndex.songIndex = currPlaylistHistory[currPlaylistHistory.length - 1];
        this.currentSeq = [];
      }
    }

    return this.switchNextSong(playerIndex, this.settings.straight);
  }

  public getPrevSong(playerIndex: PlayerIndex): PlayerIndex {
    // reset history on moving back
    this.resetHistory();

    let pl = this.playlists.value[playerIndex.playlistIndex];
    const { songIndex } = playerIndex;

    if (!pl) {
      return null;
    }

    if (pl.songs[songIndex - 1]) {
      return { ...playerIndex, songIndex: songIndex - 1 };
    } else {
      if (this.playlists.value[playerIndex.playlistIndex - 1]) {
        pl = this.playlists.value[playerIndex.playlistIndex - 1];
        return { playlistIndex: playerIndex.playlistIndex - 1, songIndex: pl.songs.length - 1 };
      } else {
        return null;
      }
    }
  }

  public moveSongsInPlaylists(event: CdkDragDrop<any>, plIndex: number): void {
    const currPlaylists = this.playlists.value;
    let oldPlaylistIndex, newPlaylistIndex;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      const pl = currPlaylists[plIndex];

      pl.songs = event.container.data;
      this.playlists.next(currPlaylists);
      localStorage.setItem('playlists', JSON.stringify(currPlaylists));
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);

      oldPlaylistIndex = this.getPlaylistIndexFromDropListId(event.previousContainer.id);
      newPlaylistIndex = this.getPlaylistIndexFromDropListId(event.container.id);
      const oldPlaylist = currPlaylists[oldPlaylistIndex];
      const newPlaylist = currPlaylists[newPlaylistIndex];

      oldPlaylist.songs = event.previousContainer.data;
      newPlaylist.songs = event.container.data;

      this.playlists.next(currPlaylists);
      localStorage.setItem('playlists', JSON.stringify(currPlaylists));
    }

    // update playlist history
    const oldPlaylistHistory = this.history[oldPlaylistIndex];

    if (oldPlaylistHistory && oldPlaylistHistory[oldPlaylistHistory.length - 1] >= event.previousIndex) {
      oldPlaylistHistory[oldPlaylistHistory.length - 1]--;
    }

    const newPlaylistHistory = this.history[newPlaylistIndex];

    if (newPlaylistHistory && newPlaylistHistory[newPlaylistHistory.length - 1] >= event.currentIndex) {
      newPlaylistHistory[newPlaylistHistory.length - 1]++;
    }

    this.onMoveSong.next();
  }

  private getPlaylistIndexFromDropListId(id: string): number {
    const idParts = id.split('-');

    return parseInt(idParts[idParts.length - 1]);
  }

  private switchNextSong(playerIndex: PlayerIndex, switchPlaylistOnLastSong = false): PlayerIndex {
    const pl = this.playlists.value[playerIndex.playlistIndex];
    const { songIndex } = playerIndex;

    if (!pl) {
      return null;
    }

    const currPlaylistHistory = this.history[playerIndex.playlistIndex];

    if (currPlaylistHistory.length === pl.songs.length) {
      this.history[playerIndex.playlistIndex] = [];
    }

    if (pl.songs[songIndex + 1]) {
      currPlaylistHistory.push(songIndex + 1);
      this.currentSeq.push(songIndex + 1);
      return { ...playerIndex, songIndex: songIndex + 1 };
    } else {
      if (switchPlaylistOnLastSong) {
        if (this.playlists.value[playerIndex.playlistIndex + 1]) {
          return { playlistIndex: playerIndex.playlistIndex + 1, songIndex: 0 };
        } else {
          return null;
        }
      } else {
        currPlaylistHistory.push(0);
        this.currentSeq.push(0);

        return { ...playerIndex, songIndex: 0 };
      }
    }
  }

  public resetHistory(): void {
    this.history = {};
    this.currentSeq = [];
  }

  public initHistory(plIndex: PlayerIndex = { playlistIndex: 0, songIndex: 0 }): void {
    this.resetHistory();
    this.history[plIndex.playlistIndex] = [ plIndex.songIndex ];
    this.currentSeq = [ plIndex.songIndex ];
  }
}
