// Profil ISISPractitioner (hérite de fr-core-practitioner)
export interface Practitioner {
  resourceType: 'Practitioner';
  id?: string;

  /** Identifiant RPPS (obligatoire, selon votre profil) */
  identifier: Array<{
    system: 'https://esante.gouv.fr/produits-services/repertoire-rpps';
    value: string;  // RPPS
  }>;

  /** Nom et prénom (1..1) */
  name: {
    family: string;
    given: [string];
  };

  /** Genre, date de naissance, adresse… hérités de FR-Core (optionnels) */
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string; // YYYY-MM-DD

  /** Télécom slicé en email, téléphone pro (work) et autres */
  telecom: Array<
    // Email professionnel ou personnel
    { system: 'email'; value: string } |
    // Téléphone pro
    { system: 'phone'; use: 'work'; value: string } |
    // Autres canaux
    { system: string; value: string }
  >;

  /** Adresse postale (héritée de FR-Core) */
  address?: Array<{
    line: string[];
    city?: string;
    postalCode?: string;
    country?: string;
  }>;

  /** Photo (optionnel, base64 sans préfixe) */
  photo?: Array<{
    contentType: string; // e.g. 'image/jpeg'
    data: string;
  }>;
}

