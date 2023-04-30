import { Component, OnInit } from '@angular/core';
import {map, Observable} from "rxjs";
import {EmployeeModel} from "../../../core/models";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit {
  employees$: Observable<EmployeeModel[]> = new Observable<EmployeeModel[]>();

  constructor(
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.employees$ = this.activatedRoute.data.pipe(map((data) => {
      if (data['employees'].length && !!data['employees']){
        return data['employees'];
      }
      return [];
    }));
  }

}
