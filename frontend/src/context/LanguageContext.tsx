"use client";
import { API_URL } from "@/config/api";


import React, { createContext, useContext, useState, useEffect } from "react";

interface Language {
  name: string;
  code: string;
  direction: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate?: number;
}

interface LanguageContextProps {
  lang: string;
  direction: string;
  currency: string;
  currencySymbol: string;
  currencyRate: number;
  translations: Record<string, string>;
  activeLanguages: Language[];
  currencies: Currency[];
  t: (key: string, defaultVal?: string) => string;
  changeLanguage: (code: string) => void;
  changeCurrency: (code: string) => void;
  convertPrice: (amountInUSD: number) => number;
  formatPrice: (amountInUSD: number) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<string>("EN");
  const [direction, setDirection] = useState<string>("LTR");
  const [currency, setCurrency] = useState<string>("USD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");
  const [currencyRate, setCurrencyRate] = useState<number>(1.0);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [activeLanguages, setActiveLanguages] = useState<Language[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize from LocalStorage (safe client-side check)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("lang") || "EN";
      const savedDir = localStorage.getItem("direction") || "LTR";
      const savedCurr = localStorage.getItem("currency") || "USD";
      const savedSym = localStorage.getItem("currencySymbol") || "$";
      const savedRate = parseFloat(localStorage.getItem("currencyRate") || "1.0");

      setLang(savedLang);
      setDirection(savedDir);
      setCurrency(savedCurr);
      setCurrencySymbol(savedSym);
      setCurrencyRate(savedRate);

      // Set HTML dir attribute
      document.documentElement.dir = savedDir.toLowerCase();
    }
  }, []);

  // Fetch active languages and currencies list
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Fetch settings first to get defaults
        let defLang = "EN";
        let defCurr = "USD";
        let defSym = "$";
        let defRate = 1.0;
        let defDir = "LTR";

        const settingsRes = await fetch(`${API_URL}/settings`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          settingsData.forEach((setting: any) => {
            let val = setting.setting_value;
            if (typeof val === "string") {
              try { val = JSON.parse(val); } catch {}
            }
            if (setting.setting_key === "default_language") {
              defLang = val?.code || "EN";
            } else if (setting.setting_key === "default_currency") {
              defCurr = val?.code || "USD";
            }
          });
        }

        // Fetch active languages
        const langRes = await fetch(`${API_URL}/languages/active`);
        let activeLangsList: Language[] = [];
        if (langRes.ok) {
          activeLangsList = await langRes.json();
          setActiveLanguages(activeLangsList);
          
          const matchingLang = activeLangsList.find(l => l.code === defLang);
          if (matchingLang) {
            defDir = matchingLang.direction || "LTR";
          }
        }

        // Fetch currencies
        const currRes = await fetch(`${API_URL}/freelancer/currencies`);
        let activeCurrsList: Currency[] = [];
        if (currRes.ok) {
          activeCurrsList = await currRes.json();
          setCurrencies(activeCurrsList);
          
          const matchingCurr = activeCurrsList.find(c => c.code === defCurr);
          if (matchingCurr) {
            defSym = matchingCurr.symbol || "$";
            defRate = matchingCurr.rate !== undefined ? matchingCurr.rate : 1.0;
          }
        }

        // If local storage is empty, initialize with platform defaults
        if (typeof window !== "undefined") {
          const savedLang = localStorage.getItem("lang");
          const savedCurr = localStorage.getItem("currency");
          
          if (!savedLang) {
            setLang(defLang);
            setDirection(defDir);
            document.documentElement.dir = defDir.toLowerCase();
          }
          if (!savedCurr) {
            setCurrency(defCurr);
            setCurrencySymbol(defSym);
            setCurrencyRate(defRate);
          }
        }
      } catch (err) {
        console.error("Failed to load language/currency metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch translation dictionary whenever active language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/translations/${lang}`);
        if (res.ok) {
          const data = await res.json();
          setTranslations(data);
        }
      } catch (err) {
        console.error("Failed to load translation map:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTranslations();
  }, [lang]);

  const changeLanguage = (code: string) => {
    const uppercaseCode = code.toUpperCase();
    setLang(uppercaseCode);
    localStorage.setItem("lang", uppercaseCode);

    // Find and set direction
    const matchingLang = activeLanguages.find((l) => l.code === uppercaseCode);
    if (matchingLang) {
      const dir = matchingLang.direction || "LTR";
      setDirection(dir);
      localStorage.setItem("direction", dir);
      document.documentElement.dir = dir.toLowerCase();
    }
  };

  const changeCurrency = (code: string) => {
    const uppercaseCode = code.toUpperCase();
    setCurrency(uppercaseCode);
    localStorage.setItem("currency", uppercaseCode);

    const matchingCurr = currencies.find((c) => c.code === uppercaseCode);
    if (matchingCurr) {
      const sym = matchingCurr.symbol || "$";
      const rate = matchingCurr.rate !== undefined ? matchingCurr.rate : 1.0;
      setCurrencySymbol(sym);
      setCurrencyRate(rate);
      localStorage.setItem("currencySymbol", sym);
      localStorage.setItem("currencyRate", rate.toString());
    }
  };

  const convertPrice = (amountInUSD: number) => {
    return amountInUSD * currencyRate;
  };

  const formatPrice = (amountInUSD: number) => {
    const converted = convertPrice(amountInUSD);
    return `${currencySymbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

const STATIC_FALLBACK_DICTIONARY: Record<string, Record<string, string>> = {
  FR: {
    nav_categories: "Catégories",
    nav_talent: "Engager des Freelances",
    nav_projects: "Trouver des Projets",
    nav_gigs: "Explorer les Services",
    nav_blogs: "Blogs",
    btn_back: "Retour",
    btn_send_message: "Envoyer un Message",
    btn_hire_freelancer: "Engager ce Freelance",
    btn_browse: "Parcourir",
    btn_view_all_categories: "Voir toutes les catégories",
    categories_title: "Parcourir les catégories populaires",
    professional_bio: "Biographie Professionnelle",
    freelancer_metadata: "Détails du Freelance",
    core_competencies: "Compétences Clés",
    hourly_rate: "Taux Horaire",
    exp_level: "Niveau d'Expérience",
    active: "actif(s)",
    jobs: "projets",
    available_now: "Disponible Maintenant",
    currently_busy: "Occupé Actuellement",
    sign_in: "Se connecter",
    get_started: "Commencer",
    dashboard: "Tableau de bord",
    nav_view_profile: "Voir le profil",
    nav_logout: "Déconnexion",
    views: "vues",
    reviews: "avis",
    save_to_wishlist: "Ajouter aux favoris",
    saved: "Enregistré",
    search_gigs_placeholder: "Rechercher des services...",
    active_gigs: "services actifs",
    starting_at: "À partir de",
    btn_previous: "Précédent",
    btn_next: "Suivant",
    refine_search: "Affiner la recherche",
    filters: "Filtres",
    reset: "Réinitialiser",
    category: "Catégorie",
    subcategory: "Sous-catégorie",
    showing: "Affichage de",
    of: "sur",
    by: "Par",
    delivery: "livraison",
    hero_badge: "Le Top 3% des Freelances Mondiaux",
    hero_title: "Engagez des Freelances Experts Pour Votre Prochain Projet",
    hero_subtitle: "Connectez-vous avec des professionnels de premier ordre. Exécutez plus rapidement avec des talents vérifiés.",
    hero_search_placeholder: "Quelle compétence recherchez-vous ?",
    hero_search_btn: "Trouver un Talent",
    top_ranked_services: "Services les mieux notés",
    popular_services_title: "Services Populaires",
    view_all: "Tout Voir",
    active_marketplace_needs: "Besoins Actuels du Marché",
    recent_projects_title: "Derniers Projets",
    browse_all: "Tout Parcourir",
    featured_title: "Freelances En Vedette",
    featured_subtitle: "Professionnels les mieux notés prêts à commencer immédiatement.",
    featured_btn: "Voir tout",
    why_choose_title: "Pourquoi Choisir Freelancer ?",
    why_choose_subtitle: "Nous offrons une expérience transparente pour trouver, engager et gérer les meilleurs talents.",
    how_it_works_title: "Comment Ça Marche",
    btn_hire_now: "Engager Maintenant",
    footer_company: "Entreprise",
    footer_about: "À Propos",
    footer_careers: "Carrières",
    footer_contact: "Contact",
    footer_faq: "FAQ",
    footer_terms: "Conditions Générales",
    footer_connect: "Rejoignez-nous",
    footer_newsletter: "Newsletter",
    footer_mobile_app: "Application Mobile",
    pricing_package: "FORFAIT TARIFIAIRE",
    available_addons: "EXTRAS / OPTIONS DISPONIBLES",
    btn_order_service: "Commander le Service Maintenant",
    delivery_in: "Livraison en",
    days: "Jours",
    revisions: "Révisions",
    unlimited_revisions: "Révisions Illimitées",
    whats_included: "Ce qui est inclus",
    service_description: "Description du Service",
    faq_title: "Foire Aux Questions",
    customer_reviews: "Avis Clients",
    about_the_seller: "À Propos du Vendeur",
    starting_rate: "Tarif de Départ",
    view_full_profile: "Voir le Profil Complet",
    share_this_service: "Partager ce Service",
    core_expertise: "Compétences & Expertises Clés",
    footer_brand_desc: "Précision dans le professionnalisme. Rejoignez un marché organisé où des talents vérifiés créent des solutions clientes modernes.",
    footer_copyright: "© 2026 Freelancer Marketplace. Tous droits réservés.",
    no_reviews_yet: "AUCUN AVIS POUR LE MOMENT",
    similar_gigs_title: "Services Similaires Que Vous Pourriez Aimer",
    similar_gigs_subtitle: "Explorez les services d'autres professionnels d'élite dans la même catégorie.",
    no_similar_gigs_found: "AUCUN SERVICE SIMILAIRE TROUVÉ",
    promoted: "PROMU",
    hire_expert_freelancers: "Engager des Freelances Experts",
    promoted_desc: "Obtenez des solutions sur mesure adaptées précisément à votre budget et à vos délais.",
    hover_category_prompt: "Survolez n'importe quelle catégorie ci-dessus pour explorer les sous-catégories.",
    btn_back_to_projects: "Retour aux Projets",
    project_type: "Type de Projet",
    experience_level: "Niveau d'Expérience",
    duration: "Durée Estimée",
    location: "Emplacement",
    project_description: "Description du Projet",
    skills_required: "Compétences Requises",
    preferred_languages: "Langues Préférées",
    project_budget: "Budget du Projet",
    submit_proposal: "Soumettre une Proposition",
    about_client: "À Propos du Client",
    client_name: "Nom du Client",
    industry: "Secteur d'Activité",
    website: "Site Web",
    member_since: "Membre Depuis",
    share_this_project: "Partager ce Projet",
    search_category: "Catégorie de Recherche",
    search_freelancers_placeholder: "Rechercher des freelances...",
    showing: "Affichage de",
    professionals: "professionnels",
    sort_by: "Trier par",
    sort_recommended: "Recommandé",
    sort_rate_high_low: "Tarif Horaire : Du + Élevé au - Élevé",
    sort_rate_low_high: "Tarif Horaire : Du - Élevé au + Élevé",
    home2_hero_title_prefix: "Transformez",
    home2_hero_title_highlight: "Votre Équipe avec",
    home2_hero_title_suffix: "La Découverte des Meilleurs Talents",
    home2_hero_subtitle: "Épanouissez-vous dans un écosystème freelance dynamique dédié à l'excellence et aux opportunités illimitées.",
    home2_search_placeholder: "Rechercher par mot-clé",
    home2_filter_label: "Vendeurs",
    home2_search_btn: "Rechercher",
    home2_popular_label: "Catégories populaires",
    home2_category_chips: "Marketing numérique, Analyse et Stratégie, Services IA",
    home2_cs_badge: "Meilleurs Plans à Choisir",
    home2_cs_title: "Conçu Avec Attention et Proche de Vos Besoins",
    home2_cs_subtitle: "Entrez dans un monde de possibilités illimitées, où les talents extraordinaires s'épanouissent."
  },
  ES: {
    nav_categories: "Categorías",
    nav_talent: "Contratar Freelancers",
    nav_projects: "Buscar Proyectos",
    nav_gigs: "Explorar Servicios",
    nav_blogs: "Blogs",
    btn_back: "Volver",
    btn_send_message: "Enviar Mensaje",
    btn_hire_freelancer: "Contratar Freelance",
    btn_browse: "Explorar",
    btn_view_all_categories: "Ver todas las categorías",
    categories_title: "Explorar categorías populares",
    professional_bio: "Biografía Profesional",
    freelancer_metadata: "Detalles del Freelancer",
    core_competencies: "Competencias Principales",
    hourly_rate: "Tarifa por hora",
    exp_level: "Nivel de experiencia",
    active: "activo(s)",
    jobs: "trabajos",
    available_now: "Disponible ahora",
    currently_busy: "Ocupado actualmente",
    sign_in: "Iniciar sesión",
    get_started: "Comenzar",
    dashboard: "Panel de control",
    nav_view_profile: "Ver perfil",
    nav_logout: "Cerrar sesión"
  },
  AR: {
    nav_categories: "الفئات",
    nav_talent: "توظيف مستقلين",
    nav_projects: "البحث عن مشاريع",
    nav_gigs: "استكشاف الخدمات",
    nav_blogs: "المدونات",
    btn_back: "رجوع",
    btn_send_message: "إرسال رسالة",
    btn_hire_freelancer: "توظيف المستقل",
    btn_browse: "تصفح",
    btn_view_all_categories: "عرض جميع الفئات",
    categories_title: "تصفح الفئات الشائعة",
    professional_bio: "السيرة الذاتية المهنية",
    freelancer_metadata: "بيانات المستقل",
    core_competencies: "المهارات الأساسية",
    hourly_rate: "الأجر بالساعة",
    exp_level: "مستوى الخبرة",
    active: "نشط",
    jobs: "وظائف",
    available_now: "متاح الآن",
    currently_busy: "مشغول حالياً",
    sign_in: "تسجيل الدخول",
    get_started: "ابدأ الآن",
    dashboard: "لوحة التحكم",
    nav_view_profile: "عرض الملف الشخصي",
    nav_logout: "تسجيل الخروج"
  },
  DE: {
    nav_categories: "Kategorien",
    nav_talent: "Freelancer anheuern",
    nav_projects: "Projekte finden",
    nav_gigs: "Services erkunden",
    nav_blogs: "Blogs",
    btn_back: "Zurück",
    btn_send_message: "Nachricht senden",
    btn_hire_freelancer: "Freelancer buchen",
    btn_browse: "Durchsuchen",
    btn_view_all_categories: "Alle Kategorien anzeigen",
    categories_title: "Beliebte Kategorien durchsuchen",
    professional_bio: "Berufliches Profil",
    freelancer_metadata: "Freelancer-Informationen",
    core_competencies: "Kernkompetenzen",
    hourly_rate: "Stundensatz",
    exp_level: "Erfahrungsstufe",
    active: "aktiv",
    jobs: "Projekte",
    available_now: "Jetzt verfügbar",
    currently_busy: "Zurzeit beschäftigt",
    sign_in: "Einloggen",
    get_started: "Loslegen",
    dashboard: "Dashboard",
    nav_view_profile: "Profil anzeigen",
    nav_logout: "Abmelden"
  }
};

  const t = (key: string, defaultVal?: string) => {
    if (!key) return defaultVal || "";
    const trimmed = key.trim();
    const cleanKey = trimmed.toLowerCase();

    // 1. Check API loaded translations map
    if (translations[cleanKey]) return translations[cleanKey];
    if (translations[trimmed]) return translations[trimmed];

    // 2. Check Static Fallback Dictionary for active lang
    const langDict = STATIC_FALLBACK_DICTIONARY[lang.toUpperCase()];
    if (langDict) {
      if (langDict[cleanKey]) return langDict[cleanKey];
      if (langDict[trimmed]) return langDict[trimmed];
    }

    return defaultVal || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        direction,
        currency,
        currencySymbol,
        currencyRate,
        translations,
        activeLanguages,
        currencies,
        t,
        changeLanguage,
        changeCurrency,
        convertPrice,
        formatPrice,
        loading
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return {
      currentLanguage: "EN",
      currentCurrency: "USD",
      activeLanguages: [{ code: "EN", name: "English", is_default: true }],
      currencies: [{ code: "USD", symbol: "$", rate: 1 }],
      t: (key: string, fallback?: string) => fallback || key,
      changeLanguage: () => {},
      changeCurrency: () => {},
      convertPrice: (price: number | string) => (typeof price === "string" ? parseFloat(price) || 0 : price),
      formatPrice: (price: number | string) => `$${(typeof price === "string" ? parseFloat(price) || 0 : price).toFixed(2)}`,
      loading: false
    };
  }
  return context;
}
