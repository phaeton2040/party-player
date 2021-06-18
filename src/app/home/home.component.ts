import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faPlay } from "@fortawesome/free-solid-svg-icons/faPlay";
import { faStepBackward } from "@fortawesome/free-solid-svg-icons/faStepBackward";
import { faStepForward } from "@fortawesome/free-solid-svg-icons/faStepForward";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  playIcon = faPlay;
  nextSongIcon = faStepForward;
  prevSongIcon = faStepBackward;

  constructor(private router: Router) { }

  ngOnInit(): void { }

}
