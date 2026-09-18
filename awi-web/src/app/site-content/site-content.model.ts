export interface ContentCard {
    title: string;
    description: string;
  }
  
  export interface PricingCard {
    name: string;
    title: string;
    price: string;
    features: string; // soronként egy funkció, \n-nel elválasztva
  }
  
  export interface SiteContent {
    heroTitle: string;
    heroLead: string;
    heroImageUrl: string;
    contactPhone: string;
    contactEmail: string;
    services: ContentCard[];
    weldTypes: ContentCard[];
    pricing: PricingCard[];
  }