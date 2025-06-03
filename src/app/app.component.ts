import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MalliaGementAppComponent } from "./mallia-gement-app/mallia-gement-app.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  
})
export class AppComponent {
  title = 'MalliaGement';
}
