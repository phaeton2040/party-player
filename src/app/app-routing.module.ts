import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';

import { PlayerRoutingModule } from './player/player-routing.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'player',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    PlayerRoutingModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
