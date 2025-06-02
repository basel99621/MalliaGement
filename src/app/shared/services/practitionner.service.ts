import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Practitioner } from '../models/practitioner.model';

@Injectable({
  providedIn: 'root'
})
export class PractitionnerService {
  
  private http = inject(HttpClient); 
  public base = "https://fhir.chl.connected-health.fr/fhir/"; 
  private headers = new HttpHeaders({
    'Content-Type': 'application/fhir+json',
    'Accept'      : 'application/fhir+json'
  }); 

  getByRpps(rpps: string): Observable<Practitioner[]> {
    const params = new HttpParams()
      .set('identifier', `https://esante.gouv.fr/produits-services/repertoire-rpps|${rpps}`);

    return this.http.get<any>(`${this.base}/Practitioner`, { headers: this.headers, params }).pipe(
      map(bundle =>
        (bundle.entry ?? [])
          .filter((entry: any) => entry.resource?.resourceType === 'Practitioner')
          .map((entry: any) => this.mapToPractitioner(entry.resource))
      )
    );
  }

  getPractitionersByUrl(url: string): Observable<any> {
    return this.http.get<any>(url, { headers: this.headers }).pipe(
      map(response => ({
        total: response.total ?? 0,
        entry: (response.entry ?? [])
          .filter((entry: any) => entry.resource?.resourceType === 'Practitioner')
          .map((entry: any) => this.mapToPractitioner(entry.resource)),
        links: response.link ?? []
      }))
    );
  }

  private mapToPractitioner(fhirPractitioner: any): Practitioner {
    return {
      resourceType: 'Practitioner',
      id: fhirPractitioner.id,
      identifier: fhirPractitioner.identifier.map((id: any) => ({
        use: id.use || 'official',
        system: id.system,
        value: id.value,
        type: id.type ? {
          text: id.type.text,
          coding: id.type.coding.map((coding: any) => ({
            code: coding.code,
            display: coding.display
          }))
        } : undefined
      })),
      name: {
        family: fhirPractitioner.name[0].family,
        given: fhirPractitioner.name[0].given
      },
      telecom: fhirPractitioner.telecom.map((telecom: any) => {
        if (telecom.system == 'email') {
          return { system: 'email', value: telecom.value };
        } else if (telecom.system == 'phone' && telecom.use == 'work') {
          return { system: 'phone', use: 'work', value: telecom.value };
        } else {
          return { system: telecom.system, value: telecom.value };
        }
      }),
    };
  }
}
