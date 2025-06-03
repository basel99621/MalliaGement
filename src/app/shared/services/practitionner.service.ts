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
    'Accept': 'application/fhir+json'
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

  mapToPractitioner(resource: any): Practitioner {
    console.log(resource);
    
    return {
      resourceType: 'Practitioner',
      id: resource.id,
      identifier: resource.identifier || [],
      name: {
        family: resource.name?.[0]?.family ?? '',
        given: resource.name?.[0]?.given ?? ['']
      },
      gender: resource.gender,
      birthDate: resource.birthDate,
      telecom: resource.telecom || [],
      address: resource.address?.map((addr: any) => ({
        line: addr.line || [],
        city: addr.city,
        postalCode: addr.postalCode,
        country: addr.country
      })),
      photo: resource.photo?.map((p: any) => ({
        contentType: p.contentType,
        data: p.data
      }))
    };
  }

}
