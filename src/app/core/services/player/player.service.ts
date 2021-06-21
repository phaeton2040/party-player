import { Injectable } from "@angular/core";
import { BehaviorSubject, interval, Observable, Subject } from "rxjs";
import { Playlist } from "../../../models/playlist.interface";
import { ElectronService } from "../electron/electron.service";
import { Song } from '../../../models/song.model';
import { filter, map, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  public context: AudioContext;

  private startTime = 0;
  private offset = 0;

  private playlists: BehaviorSubject<Playlist[]> = new BehaviorSubject<Playlist[]>([]);
  private isPlaying: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private isPaused: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private currentSong: BehaviorSubject<Song> = new BehaviorSubject<Song>(null);

  public gainController: GainNode;
  public audio: AudioBufferSourceNode;

  public volume = new BehaviorSubject(0.5);

  public get playlists$(): Observable<Playlist[]> {
    return this.playlists.asObservable();
  }

  public get isPlaying$(): Observable<boolean> {
    return this.isPlaying.asObservable();
  }

  public get isPaused$(): Observable<boolean> {
    return this.isPaused.asObservable();
  }

  public get currentSong$(): Observable<Song> {
    return this.currentSong.asObservable();
  }

  public get position$(): Observable<number> {
    return interval(30)
      .pipe(
        switchMap(() => this.isPlaying),
        filter((isPlaying) => !!isPlaying),
        map(() => Math.floor(this.context.currentTime - this.startTime))
      );
  }

  constructor(private electron: ElectronService) {
    this.context = new AudioContext();
    this.context.suspend();
  }

  public addPlaylist(pl: Playlist): void {
    const currPlaylists = this.playlists.value;

    currPlaylists.push(pl);

    this.playlists.next(currPlaylists);
  }

  public removePlaylist(name: string): void {
    const currPlaylists = this.playlists.value;

    this.playlists.next(currPlaylists.filter((pl) => pl.name !== name));
  }

  public async addSongs(playlistName: string): Promise<void> {
    const currPlaylists = this.playlists.value;
    const playlist = currPlaylists.find((pl) => pl.name === playlistName);
    const songs = await this.electron.selectFiles();

    playlist.songs = playlist.songs.concat(songs);

    this.playlists.next(currPlaylists);
  }

  public findSongAndPlay(playlistName: string, index: number): Promise<void> {
    this.stop();

    const currPlaylists = this.playlists.value;
    const playlist = currPlaylists.find((pl) => pl.name === playlistName);
    const song = playlist.songs[index];

    if (!song) {
      return;
    }

    this.playSong(song);
  }

  public async playSong(song: Song): Promise<void> {
    this.currentSong.next(song);
    this.isPlaying.next(true);
    this.isPaused.next(false);

    await this.context.resume();

    try {
      this.startTime = this.context.currentTime - this.offset;

      const songArrayBuffer = await this.electron.read(song.path);
      const audioBuffer = await this.context.decodeAudioData(songArrayBuffer as ArrayBuffer);

      const currSong = this.currentSong.value;

      currSong.duration = Math.round(audioBuffer.duration);
      this.currentSong.next(currSong);

      this.audio = this.context.createBufferSource();
      this.audio.buffer = audioBuffer;
      this.gainController = this.context.createGain();
      this.gainController.gain.setValueAtTime(this.volume.value, this.context.currentTime);
      this.audio.connect(this.gainController);
      this.gainController.connect(this.context.destination);
      this.audio.start(this.context.currentTime, this.offset);
    } catch (e) {
      console.log('Error while trying to play:', e);
    }
  }

  public playCurrentOrFirst(): void {
    if (this.currentSong.value) {
      this.playSong(this.currentSong.value);
    } else {
      const pl = this.playlists.value[0];
      const song = pl ? pl.songs[0] : null;

      if (song) {
        this.playSong(song);
      }
    }
  }

  public async pauseSong(): Promise<void> {
    this.isPlaying.next(false);
    this.isPaused.next(true);
    this.audio.playbackRate.setValueAtTime(0, this.context.currentTime);

    await this.context.suspend();
  }

  public async resumeSong(): Promise<void> {
    this.isPlaying.next(true);
    this.isPaused.next(false);
    await this.context.resume();
    this.audio.playbackRate.setValueAtTime(1, this.context.currentTime);
  }

  public async stop(erase = true): Promise<void> {
    if (!this.audio) {
      return;
    }

    this.isPlaying.next(false);
    this.audio.stop();

    if (erase) {
      this.startTime = this.context.currentTime;
      this.offset = 0;
      await this.context.suspend();
    }
  }

  public setVolume(volume: number): void {
    this.volume.next(volume);

    if (this.gainController) {
      this.gainController.gain.setValueAtTime(volume, this.context.currentTime);
    }
  }

  public async seek(position: number): Promise<void> {
    await this.stop(false);
    this.offset = position;
    await this.playSong(this.currentSong.value);
  }
}
