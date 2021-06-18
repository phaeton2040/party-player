import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'rp-songs-list',
  templateUrl: './songs-list.component.html',
  styleUrls: ['./songs-list.component.scss']
})
export class SongsListComponent implements OnInit {

  value = '';

  constructor() { }

  ngOnInit(): void {
  }

}
