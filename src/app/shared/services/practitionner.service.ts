import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Practitioner } from '../models/practitioner.model';
import { PractitionerRole } from '../models/practitioner-role.model';

export interface PractitionerWithRoleInput {
  family: string;
  given: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  rpps: string;
  matricule: string;
  birthDate: string;
  addressLine: string[];
  city: string;
  postalCode: string;
  country: string;
  telecom: Array<{ system: 'phone' | 'email'; use?: 'work' | 'home'; value: string }>;
  photoBase64?: string;

  /** Plusieurs rôles, chacun avec période, spécialité, organisation */
  roles: Array<{
    serviceStart: string;       // YYYY-MM-DD
    serviceEnd?: string;        // YYYY-MM-DD
    specialty: { system: string; code: string; display?: string };
    organizationId: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class FhirService {
  private base = 'https://fhir.chl.connected-health.fr/fhir';
  private headers = new HttpHeaders({
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json'
  });

  constructor(private http: HttpClient) { }

  /**
   * 1) Crée le Practitioner (POST)
   */
  private createPractitioner(input: PractitionerWithRoleInput): Observable<Practitioner> {
    const resource: Practitioner = {
      resourceType: 'Practitioner',
      identifier: [
        {
          use: 'official',
          system: 'https://hl7.fr/ig/fhir/core/CodeSystem/fr-core-cs-v2-0203',
          value: input.matricule,
          type: {
            text: 'Matricule',
            coding: [{ code: 'INTRN', display: 'Identifiant interne' }]
          }
        },
        {
          use: 'official',
          system: 'https://esante.gouv.fr/produits-services/repertoire-rpps',
          value: input.rpps,
          type: {
            text: 'N° RPPS',
            coding: [{ code: 'RPPS', display: 'N° RPPS' }]
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
      telecom: input.telecom.map(t => ({ system: t.system, use: t.use, value: t.value })),
      ...(input.photoBase64 ? { photo: [{ contentType: 'image/jpeg', data: input.photoBase64 }] } : {})
    };

    return this.http.post<Practitioner>(`${this.base}/Practitioner`, resource, { headers: this.headers });
  }

   updatePractitioner(id: string, input: PractitionerWithRoleInput): Observable<Practitioner> {
  const resource: Practitioner = {
    resourceType: 'Practitioner',
    id: id, // important pour un PUT
    identifier: [
      {
        use: 'official',
        system: 'https://hl7.fr/ig/fhir/core/CodeSystem/fr-core-cs-v2-0203',
        value: input.matricule,
        type: {
          text: 'Matricule',
          coding: [{ code: 'INTRN', display: 'Identifiant interne' }]
        }
      },
      {
        use: 'official',
        system: 'https://esante.gouv.fr/produits-services/repertoire-rpps',
        value: input.rpps,
        type: {
          text: 'N° RPPS',
          coding: [{ code: 'RPPS', display: 'N° RPPS' }]
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
    telecom: input.telecom.map(t => ({ system: t.system, use: t.use, value: t.value })),
    ...(input.photoBase64 ? { photo: [{ contentType: 'image/jpeg', data: input.photoBase64 }] } : {})
  };

  return this.http.put<Practitioner>(`${this.base}/Practitioner/${id}`, resource, {
    headers: this.headers
  });
}


supprimerPraticienAvecRelations(id: string): Observable<any> {
  return forkJoin({
    roles: this.getRolesByPractitionerId(id),
    appointments: this.getAppointmentsByPractitionerId(id).pipe(
      map((bundle: any) =>
        Array.isArray(bundle.entry) ? bundle.entry.map((e: any) => e.resource) : []
      )
    ),
    schedules: this.getSchedulesByPractitionerId(id).pipe(
      map((bundle: any) =>
        Array.isArray(bundle.entry) ? bundle.entry.map((e: any) => e.resource) : []
      )
    )
  }).pipe(
    switchMap(({ roles, appointments, schedules }) => {
      const deleteRequests: Observable<any>[] = [];

      // Supprimer les rôles
      if (Array.isArray(roles)) {
        roles.forEach(role => {
          deleteRequests.push(
            this.http.delete(`${this.base}/PractitionerRole/${role.id}`).pipe(
              catchError(err => {
                console.warn('Échec suppression PractitionerRole:', role.id, err);
                return of(null);
              })
            )
          );
        });
      }

      // Supprimer les rendez-vous
      if (Array.isArray(appointments)) {
        appointments.forEach(appointment => {
          deleteRequests.push(
            this.http.delete(`${this.base}/Appointment/${appointment.id}`).pipe(
              catchError(err => {
                console.warn('Échec suppression Appointment:', appointment.id, err);
                return of(null);
              })
            )
          );
        });
      }

      // Supprimer les horaires
      if (Array.isArray(schedules)) {
        schedules.forEach(schedule => {
          deleteRequests.push(
            this.http.delete(`${this.base}/Schedule/${schedule.id}`).pipe(
              catchError(err => {
                console.warn('Échec suppression Schedule:', schedule.id, err);
                return of(null);
              })
            )
          );
        });
      }

      // Suppression finale du praticien
      return forkJoin(deleteRequests).pipe(
        switchMap(() =>
          this.http.delete(`${this.base}/Practitioner/${id}`).pipe(
            tap(() => console.log(`✅ Practitioner/${id} supprimé`)),
            catchError(err => {
              console.error(`❌ Échec suppression Practitioner/${id}`, err);
              return throwError(() => err);
            })
          )
        )
      );
    })
  );
}


  /**
   * 2) Crée un PractitionerRole pour un rôle donné
   */
  private createPractitionerRole(
    practId: string,
    roleDef: PractitionerWithRoleInput['roles'][0],
    rpps: string
  ): Observable<PractitionerRole> {
    const resource: PractitionerRole = {
      resourceType: 'PractitionerRole',
      identifier: [
        { system: 'https://esante.gouv.fr/produits-services/repertoire-rpps', value: rpps }
      ],
      practitioner: { reference: `Practitioner/${practId}` },
      code: [
      {
        coding: [
          {
            system:  roleDef.specialty.system,  
            code:    roleDef.specialty.code,    
            display: roleDef.specialty.display  
          }
        ]
      }
    ],
      organization: { reference: `Organization/34` },
      location: [
        { reference: `Location/${roleDef.organizationId}` }
      ], // suite à la modélisation du groupe 'Patrinoine' nous rattachons le soignant non plus à une organisation mais à une location (d'où l'incohérence dans les noms de variables)
      period: {
        start: roleDef.serviceStart,
        ...(roleDef.serviceEnd ? { end: roleDef.serviceEnd } : {})
      }
    };

    return this.http.post<PractitionerRole>(`${this.base}/PractitionerRole`, resource, { headers: this.headers });
  }

createPractitionerWithRoles(input: PractitionerWithRoleInput): Observable<{ practitioner: Practitioner, roles: PractitionerRole[] }> {
  return this.createPractitioner(input).pipe(
    switchMap(pract => {
      const calls = input.roles?.length
        ? input.roles.map(roleDef =>
            this.createPractitionerRole(pract.id!, roleDef, input.rpps)
          )
        : [];

      if (calls.length > 0) {
        return forkJoin(calls).pipe(
          map(roles => ({ practitioner: pract, roles }))
        );
      } else {
        // Aucun rôle à créer → on retourne juste le praticien et un tableau vide
        return of({ practitioner: pract, roles: [] });
      }
    })
  );
}



  /** GET Practitioner?_count={count} */
  getPractitioners(count = 5): Observable<any> {
    const params = new HttpParams().set('_count', count.toString());
    return this.http.get(`${this.base}/Practitioner`, { headers: this.headers, params });
  }

  /** GET Organisations*/
  getOrganisations(): Observable<any> { //de même nous ne voulons plus mapper à une organisation mais à une location d'où l'incohérence dans le nom de la méthode et l'appel réalisé
    return this.http.get(`${this.base}/Location`);
  }

  /** GET Practitioner?_count={count} */
  getSpecialites(): Observable<any> {
    return this.http.get(`${this.base}/ValueSet/130`);
  }

  /** GET Practitioner*/
  getAllPraticiens(): Observable<any> {
    return this.http.get(`${this.base}/Practitioner`);
  }
  
  getAllPracticiensWithRoles(): Observable<PractitionerWithRoles[]> {
  return this.getAllPraticiens().pipe(
    switchMap((bundle: any) => {
      const entries = bundle.entry || [];
      const practitioners = entries
        .filter((e: any) => e.resource?.resourceType === 'Practitioner')
        .map((e: any) => e.resource);

      const requests: Observable<PractitionerWithRoles>[] = practitioners.map((pract: any) =>
        this.getRolesByPractitionerId(pract.id).pipe(
          map(roles => ({
            practitioner: pract,
            roles: roles
          }))
        )
      );

      return forkJoin(requests); // ✅ maintenant bien typé
    })
  );
}

getAllPracticiensWithDetails(): Observable<PractitionerWithDetails[]> {
  return this.getAllPraticiens().pipe(
    switchMap((bundle: any) => {
      const entries = bundle.entry || [];
      const practitioners = entries
        .filter((e: any) => e.resource?.resourceType === 'Practitioner')
        .map((e: any) => e.resource);

      const requests: Observable<PractitionerWithDetails>[] = practitioners.map((pract: any) =>
        forkJoin({
          roles: this.getRolesByPractitionerId(pract.id),
          appointments: this.getAppointmentsByPractitionerId(pract.id),
          schedules: this.getSchedulesByPractitionerId(pract.id)
        }).pipe(
          map(({ roles, appointments, schedules }) => ({
            practitioner: pract,
            roles,
            appointments,
            schedules
          }))
        )
      );

      return forkJoin(requests);
    })
  );
}



getRolesByPractitionerId(practitionerId: string): Observable<any[]> {
  return this.http.get<any>(`${this.base}/PractitionerRole?practitioner=Practitioner/${practitionerId}`).pipe(
    map(result => result.entry?.map((e: any) => e.resource) || [])
  );
}



  getAllPraticiensRole(): Observable<any> {
    return this.http.get(`${this.base}/PractitionerRole`);
  }

  /** GET Practitioner by RPPS */
  getPractitionerByRpps(rpps: string): Observable<any> {
    const params = new HttpParams().set(
      'identifier', `https://esante.gouv.fr/produits-services/repertoire-rpps|${rpps}`
    );
    return this.http.get(`${this.base}/Practitioner`, { headers: this.headers, params });
  }

  /** GET Appointment?actor=Practitioner/{id} */
  getAppointmentsByPractitionerId(id: string): Observable<any> {
    const params = new HttpParams().set('actor', `Practitioner/${id}`);
    return this.http.get(`${this.base}/Appointment`, { headers: this.headers, params });
  }
  /** GET Appointment?actor=Practitioner/{id} */
  getSchedulesByPractitionerId(id: string): Observable<any> {
    const params = new HttpParams().set('actor', `Practitioner/${id}`);
    return this.http.get(`${this.base}/Schedule`, { headers: this.headers, params });
  }

  /** GET Appointment by RPPS (enchaîné) */
  getAppointmentsByPractitionerRpps(rpps: string): Observable<any> {
    return this.getPractitionerByRpps(rpps).pipe(
      switchMap((bundle: any) => {
        const id = bundle.entry?.[0]?.resource?.id;
        if (!id) {
          return this.http.get(`${this.base}/Appointment?actor=Practitioner/none`, { headers: this.headers });
        }
        return this.getAppointmentsByPractitionerId(id);
      })
    );
  }
}

export interface PractitionerWithRoles {
  practitioner: any; // ou de type `Practitioner` si typé
  roles: any[];      // ou `PractitionerRole[]`
}

interface PractitionerWithDetails {
  practitioner: any;
  roles: any[];
  appointments: any[];
  schedules: any[];
}

/*EXEMPLE D'UTILISATION


this.fhirService.createPractitionerWithRoles({
  family: 'Durand',
  given: 'Sophie',
  gender: 'female',
  rpps: '01821206',
  matricule: '102118100407670',
  birthDate: '1990-02-15',
  addressLine: ['5 avenue des Champs-Élysées'],
  city: 'Paris',
  postalCode: '75008',
  country: 'FR',
  telecom: [{ system: 'email', value: 'sophie@example.com' }],
  roles: [
    {
      serviceStart: '2020-01-01',
      serviceEnd:   '2021-12-31',
      specialty:    { system: 'http://snomed.info/sct', code: '394814009', display: 'Cardiologist' },
      organizationId: 'Org1'
    },
    {
      serviceStart: '2022-01-01',
      specialty:    { system: 'http://snomed.info/sct', code: '394814009', display: 'Cardiologist' },
      organizationId: 'Org2'
    }
  ]
})
.subscribe(rolesArray => {
  console.log('Tous les PractitionerRole créés :', rolesArray);
});
* */


// // import { Injectable } from '@angular/core';


// //
// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class PractitionnerService {
// //
// //   constructor() { }
// // }
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { switchMap } from 'rxjs/operators';
// import { Practitioner } from '../models/practitioner.model';
// import { PractitionerRole } from '../models/practitioner-role.model';
//
// export interface PractitionerWithRoleInput {
//   family: string;
//   given: string;
//   gender: 'male' | 'female' | 'other' | 'unknown';
//   rpps: string;
//   matricule: string;
//   birthDate: string;            // YYYY-MM-DD
//   addressLine: string[];        // p.ex. ['10 rue de la Paix']
//   city: string;
//   postalCode: string;
//   country: string;              // p.ex. 'FR'
//   telecom: Array<{
//     system: 'phone' | 'email';
//     use?: 'work' | 'home';
//     value: string;
//   }>;
//   photoBase64?: string;         // sans préfixe data:image…;base64,
//   serviceStart: string;         // YYYY-MM-DD
//   serviceEnd?: string;          // YYYY-MM-DD
//   specialty: {                  // code issu de votre ValueSet
//     system: string;
//     code: string;
//     display?: string;
//   };
//   organizationId: string;       // id de l’Organization à référencer
// }
//
// @Injectable({ providedIn: 'root' })
// export class FhirService {
//   private base = "https://fhir.chl.connected-health.fr/fhir/";
//   private headers = new HttpHeaders({
//     'Content-Type': 'application/fhir+json',
//     'Accept'      : 'application/fhir+json'
//   });
//
//   constructor(private http: HttpClient) {}
//
//   /** PUT Practitioner/{rpps} */
//   /** PUT Practitioner/{rpps} */
//   private upsertPractitioner(input: PractitionerWithRoleInput): Observable<Practitioner> {
//     const resource: Practitioner = {
//       resourceType: 'Practitioner',
//       id: "ID-" +input.rpps,
//       identifier: [
//         {
//           use: 'official',
//           system: 'https://hl7.fr/ig/fhir/core/CodeSystem/fr-core-cs-v2-0203',
//           value: input.matricule,
//           type: {
//             text: 'Matricule',
//             coding: [
//               {
//                 code: 'INTRN',
//                 display: 'Identifiant interne'
//               }
//             ]
//           }
//         },
//         {
//           use: 'official',
//           system: 'https://esante.gouv.fr/produits-services/repertoire-rpps',
//           value: input.rpps,
//           type: {
//             text: 'Numéro de sécurité sociale',
//             coding: [
//               {
//                 code: 'RPPS',
//                 display: 'N° RPPS'
//               }
//             ]
//           }
//         }
//       ],
//       name: { family: input.family, given: [input.given] },
//       gender: input.gender,
//       birthDate: input.birthDate,
//       address: [{
//         line: input.addressLine,
//         city: input.city,
//         postalCode: input.postalCode,
//         country: input.country
//       }],
//       telecom: input.telecom.map(t => ({
//         system: t.system,
//         use: t.use,
//         value: t.value
//       })),
//       ...(input.photoBase64
//           ? { photo: [{ contentType: 'image/jpeg', data: input.photoBase64 }] }
//           : {}
//       )
//     };
//
//     return this.http.put<Practitioner>(
//       `${this.base}/Practitioner/ID-${input.rpps}`,
//       resource,
//       { headers: this.headers }
//     );
//   }
//
//   /** POST PractitionerRole */
//   private createPractitionerRole(input: PractitionerWithRoleInput): Observable<PractitionerRole> {
//     const resource: PractitionerRole = {
//       resourceType: 'PractitionerRole',
//       identifier: [
//         { system: 'https://esante.gouv.fr/produits-services/repertoire-rpps', value: input.rpps }
//       ],
//       practitioner: { reference: `Practitioner/ID-${input.rpps}` },
//       code: [{ coding: [ input.specialty ] }],
//       organization: { reference: `Organization/${input.organizationId}` },
//       period: {
//         start: input.serviceStart,
//         ...(input.serviceEnd ? { end: input.serviceEnd } : {})
//       }
//     };
//
//     return this.http.post<PractitionerRole>(
//       `${this.base}/PractitionerRole`,
//       resource,
//       { headers: this.headers }
//     );
//   }
//
//   /**
//    * Crée/MàJ Practitioner puis crée PractitionerRole.
//    * Émet la réponse du PractitionerRole.
//    */
//   createPractitionerWithRole(input: PractitionerWithRoleInput): Observable<PractitionerRole> {
//     return this.upsertPractitioner(input).pipe(
//       switchMap(() => this.createPractitionerRole(input))
//     );
//   }
//
//   /** GET Practitioner?_count={count} */
//   getPractitioners(count = 5): Observable<any> {
//     const params = new HttpParams().set('_count', count.toString());
//     return this.http.get(`${this.base}/Practitioner`, { headers: this.headers, params });
//   }
//
//   /** GET Practitioner by RPPS */
//   getPractitionerByRpps(rpps: string): Observable<any> {
//     const params = new HttpParams()
//       .set('identifier', `https://esante.gouv.fr/produits-services/repertoire-rpps|${rpps}`);
//     return this.http.get(`${this.base}/Practitioner`, { headers: this.headers, params });
//   }
//
//   /** GET Appointment?actor=Practitioner/{id} */
//   getAppointmentsByPractitionerId(id: string): Observable<any> {
//     const params = new HttpParams().set('actor', `Practitioner/${id}`);
//     return this.http.get(`${this.base}/Appointment`, { headers: this.headers, params });
//   }
//
//   /** GET Appointment by RPPS (chaîné) */
//   getAppointmentsByPractitionerRpps(rpps: string): Observable<any> {
//     return this.getPractitionerByRpps(rpps).pipe(
//       switchMap((bundle: any) => {
//         const entry = bundle.entry?.[0]?.resource;
//         if (!entry?.id) {
//           // on renvoie un bundle vide si aucun praticien trouvé
//           return this.http.get(`${this.base}/Appointment?actor=Practitioner/none`, { headers: this.headers });
//         }
//         return this.getAppointmentsByPractitionerId(entry.id);
//       })
//     );
//   }
// }
