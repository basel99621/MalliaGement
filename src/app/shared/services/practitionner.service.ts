// import { Injectable } from '@angular/core';
//
// @Injectable({
//   providedIn: 'root'
// })
// export class PractitionnerService {
//
//   constructor() { }
// }
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Practitioner } from '../models/practitioner.model';
import { PractitionerRole } from '../models/practitioner-role.model';

export interface PractitionerWithRoleInput {
  family: string;
  given: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  rpps: string;
  matricule: string;
  birthDate: string;            // YYYY-MM-DD
  addressLine: string[];        // p.ex. ['10 rue de la Paix']
  city: string;
  postalCode: string;
  country: string;              // p.ex. 'FR'
  telecom: Array<{
    system: 'phone' | 'email';
    use?: 'work' | 'home';
    value: string;
  }>;
  photoBase64?: string;         // sans préfixe data:image…;base64,
  serviceStart: string;         // YYYY-MM-DD
  serviceEnd?: string;          // YYYY-MM-DD
  specialty: {                  // code issu de votre ValueSet
    system: string;
    code: string;
    display?: string;
  };
  organizationId: string;       // id de l’Organization à référencer
}

@Injectable({ providedIn: 'root' })
export class FhirService {
  private base = "https://fhir.chl.connected-health.fr/fhir/";
  private headers = new HttpHeaders({
    'Content-Type': 'application/fhir+json',
    'Accept'      : 'application/fhir+json'
  });

  constructor(private http: HttpClient) {}

  /** PUT Practitioner/{rpps} */
  /** PUT Practitioner/{rpps} */
  private upsertPractitioner(input: PractitionerWithRoleInput): Observable<Practitioner> {
    const resource: Practitioner = {
      resourceType: 'Practitioner',
      id: "ID-" +input.rpps,
      identifier: [
        {
          use: 'official',
          system: 'https://hl7.fr/ig/fhir/core/CodeSystem/fr-core-cs-v2-0203',
          value: input.matricule,
          type: {
            text: 'Matricule',
            coding: [
              {
                code: 'INTRN',
                display: 'Identifiant interne'
              }
            ]
          }
        },
        {
          use: 'official',
          system: 'https://esante.gouv.fr/produits-services/repertoire-rpps',
          value: input.rpps,
          type: {
            text: 'Numéro de sécurité sociale',
            coding: [
              {
                code: 'RPPS',
                display: 'N° RPPS'
              }
            ]
          }
        }
      ],
      name: { family: input.family, given: [input.given] },
      gender: input.gender,
      birthDate: input.birthDate,
      address: [{
        line: input.addressLine,
        city: input.city,
        postalCode: input.postalCode,
        country: input.country
      }],
      telecom: input.telecom.map(t => ({
        system: t.system,
        use: t.use,
        value: t.value
      })),
      ...(input.photoBase64
          ? { photo: [{ contentType: 'image/jpeg', data: input.photoBase64 }] }
          : {}
      )
    };

    return this.http.put<Practitioner>(
      `${this.base}/Practitioner/ID-${input.rpps}`,
      resource,
      { headers: this.headers }
    );
  }

  /** POST PractitionerRole */
  private createPractitionerRole(input: PractitionerWithRoleInput): Observable<PractitionerRole> {
    const resource: PractitionerRole = {
      resourceType: 'PractitionerRole',
      identifier: [
        { system: 'https://esante.gouv.fr/produits-services/repertoire-rpps', value: input.rpps }
      ],
      practitioner: { reference: `Practitioner/ID-${input.rpps}` },
      code: [{ coding: [ input.specialty ] }],
      organization: { reference: `Organization/${input.organizationId}` },
      period: {
        start: input.serviceStart,
        ...(input.serviceEnd ? { end: input.serviceEnd } : {})
      }
    };

    return this.http.post<PractitionerRole>(
      `${this.base}/PractitionerRole`,
      resource,
      { headers: this.headers }
    );
  }

  /**
   * Crée/MàJ Practitioner puis crée PractitionerRole.
   * Émet la réponse du PractitionerRole.
   */
  createPractitionerWithRole(input: PractitionerWithRoleInput): Observable<PractitionerRole> {
    return this.upsertPractitioner(input).pipe(
      switchMap(() => this.createPractitionerRole(input))
    );
  }

  /** GET Practitioner?_count={count} */
  getPractitioners(count = 5): Observable<any> {
    const params = new HttpParams().set('_count', count.toString());
    return this.http.get(`${this.base}/Practitioner`, { headers: this.headers, params });
  }

  /** GET Practitioner by RPPS */
  getPractitionerByRpps(rpps: string): Observable<any> {
    const params = new HttpParams()
      .set('identifier', `https://esante.gouv.fr/produits-services/repertoire-rpps|${rpps}`);
    return this.http.get(`${this.base}/Practitioner`, { headers: this.headers, params });
  }

  /** GET Appointment?actor=Practitioner/{id} */
  getAppointmentsByPractitionerId(id: string): Observable<any> {
    const params = new HttpParams().set('actor', `Practitioner/${id}`);
    return this.http.get(`${this.base}/Appointment`, { headers: this.headers, params });
  }

  /** GET Appointment by RPPS (chaîné) */
  getAppointmentsByPractitionerRpps(rpps: string): Observable<any> {
    return this.getPractitionerByRpps(rpps).pipe(
      switchMap((bundle: any) => {
        const entry = bundle.entry?.[0]?.resource;
        if (!entry?.id) {
          // on renvoie un bundle vide si aucun praticien trouvé
          return this.http.get(`${this.base}/Appointment?actor=Practitioner/none`, { headers: this.headers });
        }
        return this.getAppointmentsByPractitionerId(entry.id);
      })
    );
  }
}
