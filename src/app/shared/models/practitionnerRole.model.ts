export interface PractitionerRole {
  resourceType: 'PractitionerRole';
  id?: string;

  identifier: Array<{
    system: 'https://esante.gouv.fr/produits-services/repertoire-rpps';
    value: string;  // RPPS
  }>;

  practitioner: {
    reference: string; // 'Practitioner/{id}'
  };

  organization: {
    reference: string; // 'Organization/{id}'
  };

  period?: {
    start?: string;  // YYYY-MM-DD
    end?: string;    // YYYY-MM-DD
  };
}