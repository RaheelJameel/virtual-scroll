import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VirtualScrollComponent } from './virtual-scroll/virtual-scroll.component';
import { ItemComponent } from './item/item.component';
import { DynamicScrollComponent } from './dynamic-scroll/dynamic-scroll.component';

@NgModule({
  declarations: [
    AppComponent,
    VirtualScrollComponent,
    ItemComponent,
    DynamicScrollComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
