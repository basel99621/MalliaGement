// // import { TestBed } from '@angular/core/testing';
// //
// // import { PractitionnerService } from './practitionner.service';
// //
// // describe('PractitionnerService', () => {
// //   let service: PractitionnerService;
// //
// //   beforeEach(() => {
// //     TestBed.configureTestingModule({});
// //     service = TestBed.inject(PractitionnerService);
// //   });
// //
// //   it('should be created', () => {
// //     expect(service).toBeTruthy();
// //   });
// // });
//
//
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FhirService, PractitionerWithRoleInput } from './practitionner.service';

describe('FhirService', () => {
  let service: FhirService;
  let httpMock: HttpTestingController;
  const base = 'https://fhir.chl.connected-health.fr/fhir';
  const headers = {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json'
  };
//
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ FhirService ]
    });
    service = TestBed.inject(FhirService);
    httpMock = TestBed.inject(HttpTestingController);
  });
//
  afterEach(() => {
    httpMock.verify();
  });
//
//   it('should GET practitioners with _count=5 by default', () => {
//     service.getPractitioners().subscribe();
//
//     const req = httpMock.expectOne(req =>
//       req.method === 'GET' &&
//       req.url === `${base}/Practitioner` &&
//       req.params.get('_count') === '5'
//     );
//     expect(req.request.headers.get('Accept')).toBe(headers.Accept);
//     req.flush({ resourceType: 'Bundle', entry: [] });
//   });
//
//   it('should GET practitioner by RPPS', () => {
//     const rpps = '12345';
//     service.getPractitionerByRpps(rpps).subscribe();
//
//     const req = httpMock.expectOne(req =>
//       req.method === 'GET' &&
//       req.url === `${base}/Practitioner` &&
//       req.params.get('identifier') === `https://esante.gouv.fr/produits-services/repertoire-rpps|${rpps}`
//     );
//     expect(req.request.headers.get('Content-Type')).toBe(headers['Content-Type']);
//     req.flush({ resourceType: 'Bundle', entry: [] });
//   });
//
//   it('should PUT practitioner with RPPS as id', () => {
//     const input: PractitionerWithRoleInput = {
//       family: 'Dupont',
//       given: 'Jean',
//       gender: 'male',
//       rpps: '67890',
//       matricule: 'M-001',
//       birthDate: '1980-01-01',
//       addressLine: ['1 rue Test'],
//       city: 'Paris',
//       postalCode: '75001',
//       country: 'FR',
//       telecom: [{ system: 'phone', use: 'work', value: '0102030405' }],
//       serviceStart: '2025-05-01',
//       specialty: { system: 'http://snomed.info/sct', code: '40617009', display: 'Cardiologist' },
//       organizationId: 'Org1'
//     };
//
//     service['upsertPractitioner'](input).subscribe(res => {
//       expect(res.id).toBe(input.rpps);
//     });
//
//     const req = httpMock.expectOne(`${base}/Practitioner/${input.rpps}`);
//     expect(req.request.method).toBe('PUT');
//     expect(req.request.body.id).toBe(input.rpps);
//     expect(req.request.body.identifier.length).toBe(2);
//     req.flush({ ...input, resourceType: 'Practitioner', id: input.rpps });
//   });
//
//   it('should GET appointments by practitioner id', () => {
//     const id = '67890';
//     service.getAppointmentsByPractitionerId(id).subscribe();
//
//     const req = httpMock.expectOne(r =>
//       r.method === 'GET' &&
//       r.url === `${base}/Appointment` &&
//       r.params.get('actor') === `Practitioner/${id}`
//     );
//     req.flush({ resourceType: 'Bundle', entry: [] });
//   });
//
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
//
//   it('should chain GET practitioner by RPPS then GET appointments', () => {
//     const rpps = '99999';
//     // 1) appel GET Practitioner?identifier=...
//     // 2) puis GET Appointment?actor=Practitioner/{id}
//     service.getAppointmentsByPractitionerRpps(rpps).subscribe(bundle => {
//       expect(bundle.resourceType).toBe('Bundle');
//     });
//
//
//
//     // 1st request: find practitioner
//     const req1 = httpMock.expectOne(r =>
//       r.method === 'GET' &&
//       r.url === `${base}/Practitioner` &&
//       r.params.get('identifier')!.endsWith(rpps)
//     );
//     // on renvoie un bundle avec un seul entry.resource.id = rpps
//     req1.flush({
//       resourceType: 'Bundle',
//       entry: [{ resource: { resourceType: 'Practitioner', id: rpps } }]
//     });
//
//     // 2nd request: list appointments
//     const req2 = httpMock.expectOne(r =>
//       r.method === 'GET' &&
//       r.url === `${base}/Appointment` &&
//       r.params.get('actor') === `Practitioner/${rpps}`
//     );
//     req2.flush({ resourceType: 'Bundle', entry: [] });
//   });
});
