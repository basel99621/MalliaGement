// // Description: Fichier de test minimal qui importe TOUTES les fonctions du fichier service.ts pour les tester

// Description: Test natif des endpoints FHIR, utilisant uniquement fetch natif (aucun usage d'Angular/FhirService)

const base = 'https://fhir.chl.connected-health.fr/fhir';
const headers = {
  'Content-Type': 'application/fhir+json',
  'Accept': 'application/fhir+json'
};

// GET /Practitioner?_count={count}
async function getPractitioners(count = 5) {
  const url = `${base}/Practitioner?_count=${count}`;
  console.log('GET', url, { headers });
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log('RESPONSE', data);
    return data;
  } catch (error) {
    console.error('ERROR in getPractitioners:', error);
    throw error;
  }
}

// GET /Organisation
async function getOrganisations() {
  const url = `${base}/Organization`;
  console.log('GET', url, { headers });
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log('RESPONSE', data);
    return data;
  } catch (error) {
    console.error('ERROR in getPractitioners:', error);
    throw error;
  }
}

// GET /Practitioner?identifier=https://esante.gouv.fr/produits-services/repertoire-rpps|{rpps}
async function getPractitionerByRpps(rpps: string) {
  const url = `${base}/Practitioner?identifier=https://esante.gouv.fr/produits-services/repertoire-rpps%7C${rpps}`;
  console.log('GET', url, { headers });
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log('RESPONSE', data);
  return data;
}

// GET /Appointment?actor=Practitioner/{id}
async function getAppointmentsByPractitionerId(id: string) {
  const url = `${base}/Appointment?actor=Practitioner/${id}`;
  console.log('GET', url, { headers });
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log('RESPONSE', data);
  return data;
}

// GET Appointment by RPPS (enchaîné)
async function getAppointmentsByPractitionerRpps(rpps: string) {
  const practitionerData = await getPractitionerByRpps(rpps);
  const id = practitionerData.entry?.[0]?.resource?.id;
  if (!id) {
    console.log('Practitioner not found');
    return;
  }
  return await getAppointmentsByPractitionerId(id);
}

// POST /Practitioner puis POST /PractitionerRole pour chaque rôle
async function createPractitionerWithRoles(input: {
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
  roles: Array<{
    serviceStart: string;
    serviceEnd?: string;
    specialty: { system: string; code: string; display?: string };
    organizationId: string;
  }>;
}) {
  console.log(input);
  
  // 1) Crée le Practitioner (POST)
  const practitionerResource = {
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

  const practitionerRes = await fetch(`${base}/Practitioner`, {
    method: 'POST',
    headers,
    body: JSON.stringify(practitionerResource)
  });
  const practitionerData = await practitionerRes.json();
  console.log('RESPONSE Practitioner:', practitionerData);

  // 2) POST un PractitionerRole par rôle
  const rolesCreated = [];
  for (const roleDef of input.roles) {
    const practitionerRoleResource = {
      resourceType: 'PractitionerRole',
      identifier: [
        { system: 'https://esante.gouv.fr/produits-services/repertoire-rpps', value: input.rpps }
      ],
      practitioner: { reference: `Practitioner/${practitionerData.id}` },
      code: [{ coding: [roleDef.specialty] }],
      organization: { reference: `Organization/${roleDef.organizationId}` },
      period: {
        start: roleDef.serviceStart,
        ...(roleDef.serviceEnd ? { end: roleDef.serviceEnd } : {})
      }
    };
    const roleRes = await fetch(`${base}/PractitionerRole`, {
      method: 'POST',
      headers,
      body: JSON.stringify(practitionerRoleResource)
    });
    const roleData = await roleRes.json();
    console.log('RESPONSE PractitionerRole:', roleData);
    rolesCreated.push(roleData);
  
  }
  return { practitioner: practitionerData, roles: rolesCreated };
}

// --- DEMOS --- (décommente pour tester)
(async () => {
  console.log('\n--- getPractitioners ---');
  await getPractitioners();

  console.log('\n--- getPractitionerByRpps ---');
  await getPractitionerByRpps('12345');

  console.log('\n--- getAppointmentsByPractitionerId ---');
  await getAppointmentsByPractitionerId('67890');

  console.log('\n--- getAppointmentsByPractitionerRpps ---');
  await getAppointmentsByPractitionerRpps('99999');

  console.log('\n--- createPractitionerWithRoles ---');
  await createPractitionerWithRoles({
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
    telecom: [{ system: 'email', value: 'sophie.durand@example.com' }],
    photoBase64: undefined,
    roles: [
      {
        serviceStart: '2025-06-01',
        specialty: { system: 'http://snomed.info/sct', code: '394814009', display: 'Cardiologist' },
        organizationId: 'Org1'
      },
      {
        serviceStart: '2025-09-01',
        serviceEnd: '2025-12-31',
        specialty: { system: 'http://snomed.info/sct', code: '394913002', display: 'General Practitioner' },
        organizationId: 'Org2'
      }
    ]
  });
})();

export {
  getPractitioners,
  getPractitionerByRpps,
  getAppointmentsByPractitionerId,
  getAppointmentsByPractitionerRpps,
  createPractitionerWithRoles,
  getOrganisations
};


// import {
//   FhirService,
//   PractitionerWithRoleInput
// } from '../services/practitionner.service';
//
// // Instanciation du service (nécessite un HttpClient Angular en vrai contexte, on mock pour le test).
// // Ici on suppose que tu utilises un environnement Angular (par exemple avec TestBed) ou que tu as un HttpClient mocké.
// // Pour un test Node.js pur, il faudrait adapter avec un fetch polyfill ou des mocks.
//
// import { HttpClient } from '@angular/common/http';
// import { firstValueFrom } from 'rxjs';
//
// // --- MOCK HttpClient si besoin (ici pour démo rapide, à remplacer par Angular TestBed en vrai) ---
// class DummyHttpClient {
//   get(...args: any[])  { throw new Error('HttpClient.get mock non implémenté'); }
//   post(...args: any[]) { throw new Error('HttpClient.post mock non implémenté'); }
// }
// const http = new DummyHttpClient() as unknown as HttpClient;
// const service = new FhirService(http);
//
// // --- TESTS ---
//
// async function testGetPractitioners() {
//   try {
//     // @ts-ignore (on suppose firstValueFrom dispo, sinon adapte)
//     const data = await firstValueFrom(service.getPractitioners(5));
//     console.log('getPractitioners:', data);
//   } catch (e) {
//     console.error('ERROR getPractitioners:', e);
//   }
// }
//
// async function testGetPractitionerByRpps() {
//   try {
//     // @ts-ignore
//     const data = await firstValueFrom(service.getPractitionerByRpps('12345'));
//     console.log('getPractitionerByRpps:', data);
//   } catch (e) {
//     console.error('ERROR getPractitionerByRpps:', e);
//   }
// }
//
// async function testGetAppointmentsByPractitionerId() {
//   try {
//     // @ts-ignore
//     const data = await firstValueFrom(service.getAppointmentsByPractitionerId('67890'));
//     console.log('getAppointmentsByPractitionerId:', data);
//   } catch (e) {
//     console.error('ERROR getAppointmentsByPractitionerId:', e);
//   }
// }
//
// async function testGetAppointmentsByPractitionerRpps() {
//   try {
//     // @ts-ignore
//     const data = await firstValueFrom(service.getAppointmentsByPractitionerRpps('99999'));
//     console.log('getAppointmentsByPractitionerRpps:', data);
//   } catch (e) {
//     console.error('ERROR getAppointmentsByPractitionerRpps:', e);
//   }
// }
//
// async function testCreatePractitionerWithRoles() {
//   const input: PractitionerWithRoleInput = {
//     family: 'Durand',
//     given: 'Sophie',
//     gender: 'female',
//     rpps: '01821206',
//     matricule: '102118100407670',
//     birthDate: '1990-02-15',
//     addressLine: ['5 avenue des Champs-Élysées'],
//     city: 'Paris',
//     postalCode: '75008',
//     country: 'FR',
//     telecom: [{ system: 'email', value: 'sophie.durand@example.com' }],
//     photoBase64: undefined,
//     roles: [
//       {
//         serviceStart: '2025-06-01',
//         specialty: { system: 'http://snomed.info/sct', code: '394814009', display: 'Cardiologist' },
//         organizationId: 'Org1'
//       }
//     ]
//   };
//   try {
//     // @ts-ignore
//     const data = await firstValueFrom(service.createPractitionerWithRoles(input));
//     console.log('createPractitionerWithRoles:', data);
//   } catch (e) {
//     console.error('ERROR createPractitionerWithRoles:', e);
//   }
// }
//
// async function runAllTests() {
//   await testGetPractitioners();
//   await testGetPractitionerByRpps();
//   await testGetAppointmentsByPractitionerId();
//   await testGetAppointmentsByPractitionerRpps();
//   await testCreatePractitionerWithRoles();
// }
//
// // Exécute tous les tests
// runAllTests();
//
// export {
//   testGetPractitioners,
//   testGetPractitionerByRpps,
//   testGetAppointmentsByPractitionerId,
//   testGetAppointmentsByPractitionerRpps,
//   testCreatePractitionerWithRoles
// };
//
//
//
//
// // // Description: Minimal client to test FHIR API
//
//
// // const base = 'https://fhir.chl.connected-health.fr/fhir';
// // const headers = {
// //   'Content-Type': 'application/fhir+json',
// //   'Accept': 'application/fhir+json'
// // };
// //
// // async function getPractitioners(count = 5) {
// //   const url = `${base}/Practitioner?_count=${count}`;
// //   console.log('GET', url, { headers });
// //   try {
// //     const res = await fetch(url, { headers });
// //     if (!res.ok) {
// //       throw new Error(`HTTP error! Status: ${res.status} ${res.statusText}`);
// //     }
// //     const data = await res.json();
// //     console.log('RESPONSE', data);
// //     return data;
// //   } catch (error) {
// //     console.error('ERROR in getPractitioners:', error);
// //     throw error;
// //   }
// // }
// //
// // async function getPractitionerByRpps(rpps: string) {
// //   const url = `${base}/Practitioner?identifier=https://esante.gouv.fr/produits-services/repertoire-rpps%7C${rpps}`;
// //   console.log('GET', url, { headers });
// //   const res = await fetch(url, { headers });
// //   const data = await res.json();
// //   console.log('RESPONSE', data);
// //   return data;
// // }
// //
// // async function upsertPractitioner(input: any) {
// //   const url = `${base}/Practitioner/${input.rpps}`;
// //   const body = {
// //     ...input,
// //     id: input.rpps,
// //     resourceType: 'Practitioner',
// //     identifier: [
// //       { system: 'https://esante.gouv.fr/produits-services/repertoire-rpps', value: input.rpps },
// //       { system: 'https://chl.connected-health.fr/matricule', value: input.matricule }
// //     ]
// //   };
// //   console.log('PUT', url, { headers, body });
// //   const res = await fetch(url, {
// //     method: 'PUT',
// //     headers,
// //     body: JSON.stringify(body)
// //   });
// //   const data = await res.json();
// //   console.log('RESPONSE', data);
// //   return data;
// // }
// //
// // async function getAppointmentsByPractitionerId(id: string) {
// //   const url = `${base}/Appointment?actor=Practitioner/${id}`;
// //   console.log('GET', url, { headers });
// //   const res = await fetch(url, { headers });
// //   const data = await res.json();
// //   console.log('RESPONSE', data);
// //   return data;
// // }
// //
// // async function getAppointmentsByPractitionerRpps(rpps: string) {
// //   // 1. Find practitioner
// //   const practitionerData = await getPractitionerByRpps(rpps);
// //   const id = practitionerData.entry?.[0]?.resource?.id;
// //   if (!id) {
// //     console.log('Practitioner not found');
// //     return;
// //   }
// //   // 2. Get appointments
// //   return await getAppointmentsByPractitionerId(id);
// // }
// //
// // async function createPractitionerWithRole(input: any) {
// //   // 1) Upsert Practitioner
// //   const practData = await upsertPractitioner(input);
// //
// //   // 2) Construire la ressource PractitionerRole
// //   const roleResource = {
// //     resourceType: 'PractitionerRole',
// //     identifier: [
// //       {
// //         system: 'https://esante.gouv.fr/produits-services/repertoire-rpps',
// //         value: input.rpps
// //       }
// //     ],
// //     practitioner: { reference: `Practitioner/${input.rpps}` },
// //     code: [{ coding: [ input.specialty ] }],
// //     organization: { reference: `Organization/${input.organizationId}` },
// //     period: {
// //       start: input.serviceStart,
// //       ...(input.serviceEnd ? { end: input.serviceEnd } : {})
// //     }
// //   };
// //
// //   // 3) POST PractitionerRole
// //   const url = `${base}/PractitionerRole`;
// //   console.log('POST', url, { headers, body: roleResource });
// //   const res = await fetch(url, {
// //     method: 'POST',
// //     headers,
// //     body: JSON.stringify(roleResource)
// //   });
// //   const roleData = await res.json();
// //   console.log('RESPONSE PractitionerRole', roleData);
// //
// //   return { practitioner: practData, role: roleData };
// // }
// //
// // // --- DEMOS --- (uncomment to test individually)
// // (async () => {
// //   await getPractitioners();
// //   await getPractitionerByRpps('12345');
// //   await upsertPractitioner({
// //     family: 'Dupont',
// //     given: 'Jean',
// //     gender: 'male',
// //     rpps: '67890',
// //     matricule: 'M-001',
// //     birthDate: '1980-01-01',
// //     addressLine: ['1 rue Test'],
// //     city: 'Paris',
// //     postalCode: '75001',
// //     country: 'FR',
// //     telecom: [{ system: 'phone', use: 'work', value: '0102030405' }],
// //     serviceStart: '2025-05-01',
// //     specialty: { system: 'http://snomed.info/sct', code: '40617009', display: 'Cardiologist' },
// //     organizationId: 'Org1'
// //   });
// //   await getAppointmentsByPractitionerId('67890');
// //   await getAppointmentsByPractitionerRpps('99999');
// //   const result = await createPractitionerWithRole({
// //     family: 'Durand',
// //     given: 'Sophie',
// //     gender: 'female',
// //     rpps: '01821206',
// //     matricule: '102118100407670',
// //     birthDate: '1990-02-15',
// //     addressLine: ['5 avenue des Champs-Élysées'],
// //     city: 'Paris',
// //     postalCode: '75008',
// //     country: 'FR',
// //     telecom: [{ system: 'email', value: 'sophie.durand@example.com' }],
// //     photoBase64: undefined,
// //     serviceStart: '2025-06-01',
// //     serviceEnd: undefined,
// //     specialty: { system: 'http://snomed.info/sct', code: '394814009', display: 'Cardiologist' },
// //     organizationId: 'Org1'
// //   });
// //   console.log('CREATED:', result);
// //
// //
// //
// //
// //
// // })();
// //
// // export {
// //   getPractitioners,
// //   getPractitionerByRpps,
// //   upsertPractitioner,
// //   getAppointmentsByPractitionerId,
// //   getAppointmentsByPractitionerRpps
// // };
