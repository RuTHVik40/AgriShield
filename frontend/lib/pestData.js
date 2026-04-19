export const RECOMMENDATIONS = {

  "Aphids": {
    overview: {
      risk: "MEDIUM",
      spread: "Fast (reproduce quickly)",
      impact: "Weakens plant, reduces yield",
      favorable_conditions: "Warm, dry weather"
    },

    symptoms: [
      { action: "Sticky honeydew on leaves" },
      { action: "Curling, yellowing leaves" },
      { action: "Presence of small green/black insects" }
    ],

    immediate: [
      { action: "Spray strong water jet to remove aphids" },
      { action: "Remove heavily infested leaves" }
    ],

    organic: [
      { action: "Apply neem oil spray", product: "Neem Oil", dosage: "5ml/L every 5 days" },
      { action: "Use soap water spray", product: "Insecticidal Soap", dosage: "3ml/L" }
    ],

    chemical: [
      { action: "Apply Imidacloprid", product: "Confidor", dosage: "0.5ml/L" },
      { action: "Use Thiamethoxam", product: "Actara", dosage: "0.3g/L" }
    ],

    recovery: {
      chance: "High if treated early"
    },

    prevention: [
      { action: "Encourage ladybugs (natural predators)" },
      { action: "Avoid excess nitrogen fertilizers" }
    ]
  },

  "Army worm": {
    overview: {
      risk: "HIGH",
      spread: "Rapid (larvae move in groups)",
      impact: "Can destroy crops overnight",
      favorable_conditions: "Warm and moist conditions"
    },

    symptoms: [
      { action: "Leaves eaten rapidly" },
      { action: "Irregular holes and skeletonized leaves" }
    ],

    immediate: [
      { action: "Inspect field early morning/evening" },
      { action: "Handpick visible larvae" }
    ],

    organic: [
      { action: "Apply Bt spray", product: "Bacillus thuringiensis", dosage: "2g/L" }
    ],

    chemical: [
      { action: "Spray Chlorantraniliprole", product: "Coragen", dosage: "0.4ml/L" },
      { action: "Use Spinosad", product: "Tracer", dosage: "0.3ml/L" }
    ],

    recovery: {
      chance: "Moderate (depends on infestation level)"
    },

    prevention: [
      { action: "Maintain field hygiene" },
      { action: "Use pheromone traps" }
    ]
  },

  "Bacterial blight": {
    overview: {
      risk: "HIGH",
      spread: "Water + wind",
      impact: "Reduces crop quality and yield",
      favorable_conditions: "Humid and rainy weather"
    },

    symptoms: [
      { action: "Water-soaked lesions" },
      { action: "Yellow halo around spots" }
    ],

    immediate: [
      { action: "Remove infected leaves" },
      { action: "Avoid overhead irrigation" }
    ],

    organic: [
      { action: "Apply copper spray", product: "Copper Oxychloride", dosage: "2g/L" }
    ],

    chemical: [
      { action: "Use Streptomycin", product: "Plantomycin", dosage: "0.5g/L" }
    ],

    recovery: {
      chance: "Moderate"
    },

    prevention: [
      { action: "Use disease-resistant seeds" },
      { action: "Ensure proper spacing" }
    ]
  },

  "Cotton Boll Rot": {
    overview: {
      risk: "HIGH",
      spread: "Fungal (moisture driven)",
      impact: "Damages cotton bolls → economic loss",
      favorable_conditions: "High humidity, waterlogging"
    },

    symptoms: [
      { action: "Rotting cotton bolls" },
      { action: "Fungal growth on bolls" }
    ],

    immediate: [
      { action: "Remove infected bolls immediately" },
      { action: "Improve drainage" }
    ],

    organic: [
      { action: "Use Trichoderma", product: "Trichoderma bio-agent", dosage: "5g/kg soil" }
    ],

    chemical: [
      { action: "Apply Carbendazim", product: "Bavistin", dosage: "1g/L" },
      { action: "Use Mancozeb", product: "Dithane M45", dosage: "2.5g/L" }
    ],

    recovery: {
      chance: "Moderate"
    },

    prevention: [
      { action: "Avoid waterlogging" },
      { action: "Maintain proper spacing" }
    ]
  },

  "Green Cotton Boll": {
    overview: {
      risk: "LOW",
      impact: "Delayed maturity",
      favorable_conditions: "Nutrient imbalance"
    },

    symptoms: [
      { action: "Unopened green bolls" },
      { action: "Delayed crop maturity" }
    ],

    immediate: [
      { action: "Check nutrient levels" }
    ],

    organic: [
      { action: "Apply balanced organic fertilizers" }
    ],

    chemical: [
      { action: "Use growth regulators if needed" }
    ],

    recovery: {
      chance: "High"
    },

    prevention: [
      { action: "Balanced fertilization" },
      { action: "Proper irrigation scheduling" }
    ]
  },

  "Healthy": {
    overview: {
      risk: "NONE",
      impact: "Crop is healthy"
    },

    symptoms: [
      { action: "No visible disease symptoms" }
    ],

    immediate: [
      { action: "Continue current practices" }
    ],

    organic: [
      { action: "Maintain soil health" }
    ],

    chemical: [
      { action: "No chemical treatment needed" }
    ],

    recovery: {
      chance: "Excellent"
    },

    prevention: [
      { action: "Regular monitoring" },
      { action: "Balanced fertilization" }
    ]
  },

  "Powdery mildew": {
    overview: {
      risk: "MEDIUM",
      spread: "Airborne fungal spores",
      impact: "Reduces photosynthesis",
      favorable_conditions: "Dry days + humid nights"
    },

    symptoms: [
      { action: "White powder on leaves" },
      { action: "Leaf curling" }
    ],

    immediate: [
      { action: "Remove infected leaves" }
    ],

    organic: [
      { action: "Neem oil spray", dosage: "5ml/L" },
      { action: "Baking soda spray", dosage: "1 tsp/L water" }
    ],

    chemical: [
      { action: "Apply Sulfur fungicide", dosage: "2g/L" },
      { action: "Use Hexaconazole", dosage: "1ml/L" }
    ],

    recovery: {
      chance: "High"
    },

    prevention: [
      { action: "Ensure airflow" },
      { action: "Avoid overcrowding" }
    ]
  },

  "Target spot": {
    overview: {
      risk: "MEDIUM",
      spread: "Fungal (moisture driven)",
      impact: "Leaf drop, yield loss",
      favorable_conditions: "High humidity"
    },

    symptoms: [
      { action: "Circular brown spots" },
      { action: "Leaf drop" }
    ],

    immediate: [
      { action: "Remove infected leaves" }
    ],

    organic: [
      { action: "Use compost tea spray" }
    ],

    chemical: [
      { action: "Apply Chlorothalonil", dosage: "2g/L" },
      { action: "Use Azoxystrobin", dosage: "1ml/L" }
    ],

    recovery: {
      chance: "Moderate"
    },

    prevention: [
      { action: "Crop rotation" },
      { action: "Avoid wet leaves" }
    ]
  }

};
export function getDisplayName(pest) {
  if (!pest) return "Unknown";

  return pest
    .replace(/___/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}