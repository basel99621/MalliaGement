import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Practitioner } from '../models/practitionner.model';

@Injectable({
  providedIn: 'root'
})
export class PractitionnerService {

  private base = "https://fhir.chl.connected-health.fr/fhir/"; 
  private headers = new HttpHeaders({
    'Content-Type': 'application/fhir+json',
    'Accept'      : 'application/fhir+json'
  });

  constructor(private http: HttpClient) { }

  /*getPractitioners(count = 5): Observable<any> {
    const params = new HttpParams().set('_count', count.toString());
    return this.http.get(`${this.base}/Practitioner`, { headers: this.headers, params });
  }*/

  getPractitioners(count = 5, pageNumber: number): Observable<Practitioner[]> {
    const params = new HttpParams()
      .set('_count', count.toString())  // Nombre d'éléments par page
      .set('__page', pageNumber.toString());  // Numéro de la page

    console.log(this.http.get<Practitioner[]>(`${this.base}/Practitioner`, { headers: this.headers, params }));

    return this.http.get<Practitioner[]>(`${this.base}/Practitioner`, { headers: this.headers, params });
  }

  getPractitionerByRpps(rpps: string): Observable<any> {
    const params = new HttpParams()
      .set('identifier', `https://esante.gouv.fr/produits-services/repertoire-rpps|${rpps}`);
    return this.http.get(`${this.base}/Practitioner`, { headers: this.headers, params });
  }
}
