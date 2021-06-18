import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatSliderModule } from "@angular/material/slider";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatExpansionModule } from "@angular/material/expansion";
import { HeaderComponent } from './components/header/header.component';
import { SongsListComponent } from './components/songs-list/songs-list.component';
import { MainComponent } from './components/main/main.component';

@NgModule({
  declarations: [
    HomeComponent,
    HeaderComponent,
    SongsListComponent,
    MainComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    HomeRoutingModule,
    FontAwesomeModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule
  ]
})
export class HomeModule {
}
