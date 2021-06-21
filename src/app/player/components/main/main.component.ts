import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Song } from '../../../models/song.model';
import { PlayerService } from '../../../core/services/player/player.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'rp-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  currentSong: Observable<Song>;
  position$ = of(0);

  constructor(private plService: PlayerService) {
    this.currentSong = this.plService.currentSong$;
    this.position$ = this.plService.position$;
  }

  ngOnInit(): void {
  }

  public formatTime(position: number): string {
    const minutes = Math.floor(position / 60).toString();
    let seconds = (position % 60).toString();

    if (seconds.toString().length === 1) {
      seconds = `0${seconds}`;
    }

    return `${minutes}:${seconds}`;
  }


  public seek(e): void {
    console.log('Seek position:', e.value);
    this.plService.seek(e.value);
  }
}
