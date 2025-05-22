// Description: Minimal client to test FHIR API
const base = 'https://fhir.chl.connected-health.fr/fhir';
const headers = {
  'Content-Type': 'application/fhir+json',
  'Accept': 'application/fhir+json'
};

async function getPractitioners(count = 5) {
  const url = `${base}/Practitioner?_count=${count}`;
  console.log('GET', url, { headers });
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('RESPONSE', data);
    return data;
  } catch (error) {
    console.error('ERROR in getPractitioners:', error);
    throw error;
  }
}

async function getPractitionerByRpps(rpps: string) {
  const url = `${base}/Practitioner?identifier=https://esante.gouv.fr/produits-services/repertoire-rpps%7C${rpps}`;
  console.log('GET', url, { headers });
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log('RESPONSE', data);
  return data;
}

async function upsertPractitioner(input: any) {
  const url = `${base}/Practitioner/${input.rpps}`;
  const body = {
    ...input,
    id: input.rpps,
    resourceType: 'Practitioner',
    identifier: [
      { system: 'https://esante.gouv.fr/produits-services/repertoire-rpps', value: input.rpps },
      { system: 'https://chl.connected-health.fr/matricule', value: input.matricule }
    ]
  };
  console.log('PUT', url, { headers, body });
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('RESPONSE', data);
  return data;
}

async function getAppointmentsByPractitionerId(id: string) {
  const url = `${base}/Appointment?actor=Practitioner/${id}`;
  console.log('GET', url, { headers });
  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log('RESPONSE', data);
  return data;
}

async function getAppointmentsByPractitionerRpps(rpps: string) {
  // 1. Find practitioner
  const practitionerData = await getPractitionerByRpps(rpps);
  const id = practitionerData.entry?.[0]?.resource?.id;
  if (!id) {
    console.log('Practitioner not found');
    return;
  }
  // 2. Get appointments
  return await getAppointmentsByPractitionerId(id);
}

async function createPractitionerWithRole(input: any) {
  // 1) Upsert Practitioner
  const practData = await upsertPractitioner(input);

  // 2) Construire la ressource PractitionerRole
  const roleResource = {
    resourceType: 'PractitionerRole',
    identifier: [
      {
        system: 'https://esante.gouv.fr/produits-services/repertoire-rpps',
        value: input.rpps
      }
    ],
    practitioner: { reference: `Practitioner/${input.rpps}` },
    code: [{ coding: [ input.specialty ] }],
    organization: { reference: `Organization/${input.organizationId}` },
    period: {
      start: input.serviceStart,
      ...(input.serviceEnd ? { end: input.serviceEnd } : {})
    }
  };

  // 3) POST PractitionerRole
  const url = `${base}/PractitionerRole`;
  console.log('POST', url, { headers, body: roleResource });
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(roleResource)
  });
  const roleData = await res.json();
  console.log('RESPONSE PractitionerRole', roleData);

  return { practitioner: practData, role: roleData };
}

// --- DEMOS --- (uncomment to test individually)
(async () => {
  await getPractitioners();
  await getPractitionerByRpps('12345');
  await upsertPractitioner({
    family: 'Dupont',
    given: 'Jean',
    gender: 'male',
    rpps: '67890',
    matricule: 'M-001',
    birthDate: '1980-01-01',
    addressLine: ['1 rue Test'],
    city: 'Paris',
    postalCode: '75001',
    country: 'FR',
    telecom: [{ system: 'phone', use: 'work', value: '0102030405' }],
    serviceStart: '2025-05-01',
    specialty: { system: 'http://snomed.info/sct', code: '40617009', display: 'Cardiologist' },
    organizationId: 'Org1'
  });
  await getAppointmentsByPractitionerId('67890');
  await getAppointmentsByPractitionerRpps('99999');
  const result = await createPractitionerWithRole({
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
    serviceStart: '2025-06-01',
    serviceEnd: undefined,
    specialty: { system: 'http://snomed.info/sct', code: '394814009', display: 'Cardiologist' },
    organizationId: 'Org1'
  });
  console.log('CREATED:', result);





})();

export {
  getPractitioners,
  getPractitionerByRpps,
  upsertPractitioner,
  getAppointmentsByPractitionerId,
  getAppointmentsByPractitionerRpps
};
