import { Component, OnInit } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { Song } from '../../../models/song.model';
import { PlayerService } from '../../../core/services/player/player.service';
import { map } from 'rxjs/operators';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: 'rp-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  currentSong: Observable<Song>;
  position$ = of(0);
  disabled$: Observable<boolean>;

  constructor(private player: PlayerService) {
    this.currentSong = this.player.currentSong$;
  }

  ngOnInit(): void {
    this.player.isPlaying$.subscribe(playing => {
      if (!playing) {
        this.position$ = of(
          0);
      } else {
        this.position$ = this.player.position$;
      }
    });
    this.disabled$ = combineLatest([
      this.player.isSeeking,
      this.player.isStop
    ]).pipe(
      map(([seek, stop]) => {
        return seek || stop;
      })
    );
  }

  public formatTime(position: number): string {
    const minutes = Math.floor(position / 60).toString();
    let seconds = (position % 60).toString();

    if (seconds.toString().length === 1) {
      seconds = `0${seconds}`;
    }

    return `${minutes}:${seconds}`;
  }


  public seek(e: MatSliderChange): void {
    this.player.seek(e.value);
  }
}
