import { Injectable } from "@angular/core";
import { BehaviorSubject, interval, Observable, pipe, Subject } from "rxjs";
import { ElectronService } from "../electron/electron.service";
import { Song } from '../../../models/song.model';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { PlaylistService } from '../playlist/playlist.service';

export interface PlayerIndex {
  playlistIndex: number;
  songIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  public context: AudioContext;

  private startTime = 0;
  private offset = 0;

  private isPlaying: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private isPaused: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private currentSong: BehaviorSubject<Song> = new BehaviorSubject<Song>(null);
  private playerIndex: BehaviorSubject<PlayerIndex> = new BehaviorSubject<PlayerIndex>({
    playlistIndex: 0,
    songIndex: 0
  });

  public gainController: GainNode;
  public audio: AudioBufferSourceNode;

  public volume = new BehaviorSubject(0.5);

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

  public get playerIndex$(): Observable<PlayerIndex> {
    return this.playerIndex.asObservable();
  }

  constructor(private electron: ElectronService,
              private playlist: PlaylistService) {
    this.context = new AudioContext();
    this.context.suspend();

    this.playlist.onRemoveSong$
      .pipe(
        filter((index: PlayerIndex) => index.playlistIndex === this.playerIndex.value.playlistIndex && index.songIndex < this.playerIndex.value.songIndex)
      )
      .subscribe(() => {
        const curIndex = this.playerIndex.value;

        curIndex.songIndex--;

        this.playerIndex.next(curIndex);
      });
  }

  public findSongAndPlay(playerIndex: PlayerIndex): void {
    if (!playerIndex) {
      return;
    }

    this.stop();
    this.playerIndex.next(playerIndex);

    this.playlist.playlists$
      .pipe(
        take(1)
      ).subscribe((playlists) => {
      const playlist = playlists[playerIndex.playlistIndex];
      const song = playlist ? playlist.songs[playerIndex.songIndex] : null;

      if (!song) {
        return;
      }

      this.playSong(song);
    });
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

      this.audio.onended = () => {
        if (this.isSeeking.value || this.isStop.value) {
          return;
        }
        this.stop();
        this.findSongAndPlay(this.playlist.getNextSong(this.playerIndex.value));
      };

      this.isSeeking.next(false);
      this.isStop.next(false);
    } catch (e) {
      console.log('Error while trying to play:', e);
    }
  }

  public playCurrentOrFirst(): void {
    if (this.currentSong.value) {
      this.playSong(this.currentSong.value);
    } else {
      this.playlist.initHistory();
      this.findSongAndPlay(this.playerIndex.value);
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

  public isStop = new BehaviorSubject(false);

  public async stop(erase = true, resetHistory = false): Promise<void> {
    if (!this.audio) {
      return;
    }

    this.isPlaying.next(false);
    this.isPaused.next(false);
    this.isStop.next(true);
    this.audio.stop();

    if (erase) {
      this.startTime = this.context.currentTime;
      this.offset = 0;
      await this.context.suspend();
    }

    if (resetHistory) {
      this.playlist.resetHistory();
    }
  }

  public setVolume(volume: number): void {
    this.volume.next(volume);

    if (this.gainController) {
      this.gainController.gain.setValueAtTime(volume, this.context.currentTime);
    }
  }

  public isSeeking = new BehaviorSubject(false);

  public async seek(position: number): Promise<void> {
    this.offset = position;
    this.isSeeking.next(true);

    await this.stop(false);
    await this.playSong(this.currentSong.value);
  }

  public async playNext(): Promise<void> {
    await this.stop();
    this.findSongAndPlay(this.playlist.getNextSong(this.playerIndex.value));
  }

  public async playPrev(): Promise<void> {
    await this.stop();
    this.findSongAndPlay(this.playlist.getPrevSong(this.playerIndex.value));
  }
}
