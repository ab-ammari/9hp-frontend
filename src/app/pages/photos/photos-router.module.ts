import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {PhotosComponent} from "./photos.component";
import {NewPhotoComponent} from "./new-photo/new-photo.component";
import {DetailsPhotoComponent} from "./details-photo/details-photo.component";


const routes: Routes = [
  { path: '', component: PhotosComponent},
  { path: 'new', component: NewPhotoComponent},
  { path: 'details', component: DetailsPhotoComponent}
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class PhotosRouterModule { }
