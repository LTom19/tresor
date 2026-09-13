import { legalInfo as L } from './legalInfo';

export type LegalPageId = 'mentions' | 'cgu' | 'confidentialite';

export interface LegalSection {
  title: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalDocument {
  id: LegalPageId;
  title: string;
  subtitle: string;
  sections: LegalSection[];
}

export const legalPages: Record<LegalPageId, LegalDocument> = {
  mentions: {
    id: 'mentions',
    title: 'Mentions légales',
    subtitle: `Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).`,
    sections: [
      {
        title: 'Éditeur du site',
        paragraphs: [
          `Le site ${L.siteUrl} et l'application ${L.appName} sont édités par :`,
          `${L.publisherName}`,
          L.publisherAddress,
          `Contact : ${L.contactEmail}`,
        ],
      },
      {
        title: 'Directeur de la publication',
        paragraphs: [L.directorOfPublication],
      },
      {
        title: 'Hébergeur',
        paragraphs: [
          `${L.hostName}`,
          L.hostAddress,
          'Les données sont stockées sur un serveur privé situé en France, accessible via le domaine ci-dessus.',
        ],
      },
      {
        title: 'Propriété intellectuelle',
        paragraphs: [
          `L'ensemble des éléments composant le site et l'application ${L.appName} (textes, graphismes, logo, structure, logiciel) est protégé par le droit de la propriété intellectuelle.`,
          'Toute reproduction, représentation ou exploitation non autorisée est interdite.',
        ],
      },
      {
        title: 'Limitation de responsabilité',
        paragraphs: [
          `${L.appName} est un outil de gestion financière personnelle mis à disposition « en l'état ».`,
          "L'éditeur s'efforce d'assurer l'exactitude des informations affichées, mais ne garantit pas l'absence d'erreurs, d'interruptions de service ou de perte de données.",
          `${L.appName} ne constitue en aucun cas un conseil financier, fiscal ou juridique.`,
        ],
      },
      {
        title: 'Droit applicable',
        paragraphs: [
          'Les présentes mentions légales sont régies par le droit français.',
          'En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.',
        ],
      },
    ],
  },

  cgu: {
    id: 'cgu',
    title: "Conditions générales d'utilisation",
    subtitle: `Règles d'utilisation de l'application ${L.appName}.`,
    sections: [
      {
        title: '1. Objet',
        paragraphs: [
          `Les présentes Conditions Générales d'Utilisation (CGU) définissent les modalités d'accès et d'utilisation de l'application ${L.appName}, accessible à l'adresse ${L.siteUrl}.`,
          `${L.appName} permet à chaque utilisateur de suivre ses comptes, abonnements, revenus et prévisions financières personnelles.`,
        ],
      },
      {
        title: '2. Acceptation',
        paragraphs: [
          "L'accès au service implique l'acceptation pleine et entière des présentes CGU et de la Politique de confidentialité.",
          "Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le service.",
        ],
      },
      {
        title: '3. Accès au service',
        paragraphs: [
          `${L.appName} est un service privé, hébergé par l'éditeur pour un usage personnel ou familial restreint.`,
          "L'éditeur se réserve le droit de refuser ou de suspendre l'accès à tout compte, notamment en cas de non-respect des présentes CGU.",
        ],
      },
      {
        title: '4. Création de compte',
        paragraphs: [
          "Pour utiliser le service, l'utilisateur doit créer un compte avec une adresse e-mail valide et un mot de passe sécurisé.",
          "L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants.",
          "Toute activité réalisée depuis le compte de l'utilisateur est réputée effectuée par celui-ci.",
        ],
      },
      {
        title: '5. Nature du service',
        paragraphs: [
          `${L.appName} est un outil de suivi et de projection. Il ne remplace ni une banque, ni un conseiller financier, ni un expert-comptable.`,
          "Les soldes, prévisions et alertes affichés dépendent des données saisies par l'utilisateur et des règles configurées dans l'application.",
          "L'utilisateur reste seul responsable de ses décisions financières.",
        ],
      },
      {
        title: '6. Données saisies',
        paragraphs: [
          "L'utilisateur est responsable de l'exactitude des informations qu'il enregistre (soldes, abonnements, montants, dates).",
          "Les prélèvements automatiques simulés par l'application le sont à titre indicatif, selon les paramètres définis par l'utilisateur.",
        ],
      },
      {
        title: '7. Disponibilité et maintenance',
        paragraphs: [
          "L'éditeur s'efforce d'assurer la disponibilité du service, sans obligation de résultat.",
          'Des interruptions peuvent survenir (maintenance, mise à jour, incident technique).',
        ],
      },
      {
        title: '8. Propriété intellectuelle',
        paragraphs: [
          `Le code, le design et les contenus de ${L.appName} restent la propriété de l'éditeur.`,
          "L'utilisateur dispose d'un droit d'usage personnel, non exclusif et non transférable, limité à l'accès au service.",
        ],
      },
      {
        title: '9. Responsabilité',
        paragraphs: [
          "L'éditeur ne saurait être tenu responsable des dommages indirects liés à l'utilisation du service (perte de données, erreur de saisie, indisponibilité temporaire).",
          "L'utilisateur est invité à effectuer des sauvegardes régulières de ses données importantes.",
        ],
      },
      {
        title: '10. Modification des CGU',
        paragraphs: [
          "L'éditeur peut modifier les présentes CGU à tout moment. La date de dernière mise à jour est indiquée en bas de page.",
          "La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles CGU.",
        ],
      },
      {
        title: '11. Droit applicable',
        paragraphs: [
          'Les présentes CGU sont soumises au droit français.',
          `Pour toute question : ${L.contactEmail}`,
        ],
      },
    ],
  },

  confidentialite: {
    id: 'confidentialite',
    title: 'Politique de confidentialité',
    subtitle: 'Informations sur le traitement de vos données personnelles (RGPD).',
    sections: [
      {
        title: '1. Responsable du traitement',
        paragraphs: [
          `${L.publisherName}`,
          L.publisherAddress,
          `E-mail : ${L.contactEmail}`,
        ],
      },
      {
        title: '2. Données collectées',
        paragraphs: ["Dans le cadre de l'utilisation de Trésor, les données suivantes peuvent être traitées :"],
        list: [
          'Identité de connexion : adresse e-mail',
          'Authentification : mot de passe (stocké sous forme chiffrée / hachée, jamais en clair)',
          'Données financières saisies : soldes de comptes, abonnements, revenus, historique des opérations',
          'Données techniques minimales : cookie de session sécurisé, journaux techniques de connexion',
        ],
      },
      {
        title: '3. Finalités du traitement',
        paragraphs: ['Vos données sont utilisées uniquement pour :'],
        list: [
          'Créer et gérer votre compte utilisateur',
          'Authentifier vos connexions',
          'Stocker et afficher vos données financières personnelles',
          "Exécuter les fonctionnalités de l'application (prélèvements automatiques, alertes, prévisions)",
          'Assurer la sécurité et le bon fonctionnement du service',
        ],
      },
      {
        title: '4. Base légale',
        paragraphs: [
          "Le traitement repose sur l'exécution du service demandé par l'utilisateur (article 6.1.b du RGPD) et, le cas échéant, sur l'intérêt légitime de l'éditeur à sécuriser la plateforme (article 6.1.f du RGPD).",
        ],
      },
      {
        title: '5. Destinataires des données',
        paragraphs: [
          'Vos données ne sont ni vendues ni cédées à des tiers.',
          "Elles sont hébergées sur l'infrastructure privée de l'éditeur (serveur en France).",
          "Aucun outil publicitaire ou de profilage commercial n'est utilisé.",
        ],
      },
      {
        title: '6. Durée de conservation',
        paragraphs: [
          'Les données du compte sont conservées tant que le compte est actif.',
          "Sur demande de suppression du compte, les données personnelles et financières associées seront effacées, sous réserve des obligations légales de conservation.",
        ],
      },
      {
        title: '7. Cookies et traceurs',
        paragraphs: [
          `${L.appName} utilise un cookie de session strictement nécessaire à l'authentification (HttpOnly, SameSite).`,
          'Ce cookie ne sert pas au suivi publicitaire.',
          "Vous pouvez supprimer les cookies via les paramètres de votre navigateur, ce qui peut toutefois empêcher la connexion au service.",
        ],
      },
      {
        title: '8. Sécurité',
        paragraphs: [
          "L'éditeur met en œuvre des mesures techniques raisonnables : authentification sécurisée, accès restreint, chiffrement des mots de passe, hébergement privé.",
          "Aucune transmission sur Internet n'étant totalement invulnérable, l'utilisateur est invité à choisir un mot de passe robuste et unique.",
        ],
      },
      {
        title: '9. Vos droits',
        paragraphs: [
          'Conformément au RGPD, vous disposez des droits suivants :',
        ],
        list: [
          "Droit d'accès à vos données",
          'Droit de rectification',
          "Droit à l'effacement (« droit à l'oubli »)",
          'Droit à la limitation du traitement',
          "Droit d'opposition",
          'Droit à la portabilité, dans la mesure applicable',
        ],
      },
      {
        title: '10. Exercer vos droits',
        paragraphs: [
          `Pour exercer vos droits, contactez : ${L.contactEmail}`,
          "Une réponse vous sera adressée dans un délai maximal d'un mois.",
          "En cas de difficulté, vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).",
        ],
      },
      {
        title: '11. Mise à jour',
        paragraphs: [
          "La présente politique peut être mise à jour pour refléter l'évolution du service ou de la réglementation.",
          `Dernière mise à jour : ${L.lastUpdated}`,
        ],
      },
    ],
  },
};
