
// Profil ISISPractitionerRole (hérite de fr-core-practitioner-role)
export interface PractitionerRole {
  resourceType: 'PractitionerRole';
  id?: string;

  /** Identifiant RPPS (obligatoire) */
  identifier: Array<{
    system: 'https://esante.gouv.fr/produits-services/repertoire-rpps';
    value: string;  // RPPS
  }>;

  /** Référence au Practitioner créé */
  practitioner: {
    reference: string; // 'Practitioner/{id}'
  };

  /** Spécialité (code issu de votre ValueSet) */
  code: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;

  /** Organisation (obligatoire) */
  organization: {
    reference: string; // 'Organization/{id}'
  };

  /** Période de service (facultative) héritée de FR-Core */
  period?: {
    start?: string;  // YYYY-MM-DD
    end?: string;    // YYYY-MM-DD
  };
}