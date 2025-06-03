// Profil ISISPractitioner (hérite de fr-core-practitioner)
export interface Practitioner {
  resourceType: 'Practitioner';
  id?: string;

  /** Identifiant RPPS (obligatoire, selon votre profil) */
  identifier: Array<{
    use : 'official' | 'usual' | 'temp' | 'secondary' | 'old';
    // On autorise soit l’URL RPPS, soit un matricule interne
    system: 'https://esante.gouv.fr/produits-services/repertoire-rpps' | 'https://hl7.fr/ig/fhir/core/CodeSystem/fr-core-cs-v2-0203';
    value: string;
    type?: {
      text: string;
      coding: Array<{
        code: string;
        display: string;
      }>;
    };
  }>;

  /** Nom et prénom (1..1) */
  name: {
    family: string;
    given: [string];
  };

  /** Genre, date de naissance, adresse… hérités de FR-Core (optionnels) */
// practitioner.model.ts
  gender?: "male" | "female" | "unknown" | "other" | undefined;
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


