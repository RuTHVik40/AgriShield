/**
 * AgriShield Pest Classification Data
 * 
 * PEST_CLASSES: Must match your model's output class indices exactly.
 * Update this array after training your model.
 * 
 * Current classes based on PlantVillage dataset (38 classes).
 */

export const PEST_CLASSES = [
  'Apple___Apple_scab',
  'Apple___Black_rot',
  'Apple___Cedar_apple_rust',
  'Apple___healthy',
  'Blueberry___healthy',
  'Cherry___Powdery_mildew',
  'Cherry___healthy',
  'Corn___Cercospora_leaf_spot',
  'Corn___Common_rust',
  'Corn___Northern_Leaf_Blight',
  'Corn___healthy',
  'Grape___Black_rot',
  'Grape___Esca_(Black_Measles)',
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
  'Grape___healthy',
  'Orange___Haunglongbing_(Citrus_greening)',
  'Peach___Bacterial_spot',
  'Peach___healthy',
  'Pepper___Bacterial_spot',
  'Pepper___healthy',
  'Potato___Early_blight',
  'Potato___Late_blight',
  'Potato___healthy',
  'Raspberry___healthy',
  'Soybean___healthy',
  'Squash___Powdery_mildew',
  'Strawberry___Leaf_scorch',
  'Strawberry___healthy',
  'Tomato___Bacterial_spot',
  'Tomato___Early_blight',
  'Tomato___Late_blight',
  'Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot',
  'Tomato___Spider_mites',
  'Tomato___Target_Spot',
  'Tomato___Yellow_Leaf_Curl_Virus',
  'Tomato___Mosaic_virus',
  'Tomato___healthy',
];

/**
 * Rule-Based Recommendation Engine
 * 
 * For each pest/disease, provides:
 * - immediate: First-aid actions within 24 hours
 * - organic:   Organic/biological treatment
 * - chemical:  Specific pesticide/fungicide names with dosages
 * - prevention: Long-term prevention strategies
 */
export const RECOMMENDATIONS = {
  'Tomato___Early_blight': {
    immediate: [
      { action: 'Remove and destroy all infected lower leaves immediately.', product: null },
      { action: 'Avoid overhead watering; switch to drip irrigation to reduce leaf wetness.', product: null },
      { action: 'Increase plant spacing to improve air circulation.', product: null },
    ],
    organic: [
      { action: 'Apply neem oil spray to affected plants.', product: 'Neem Oil 3000 ppm', dosage: '5ml/L water, spray every 7 days' },
      { action: 'Apply copper-based fungicide.', product: 'Bordeaux Mixture (1%)', dosage: 'Spray thoroughly on undersides of leaves' },
      { action: 'Use Bacillus subtilis biological fungicide.', product: 'Serenade Garden / Bioprotect', dosage: '4ml/L, weekly' },
    ],
    chemical: [
      { action: 'Apply chlorothalonil fungicide at first sign of disease.', product: 'Daconil 2787 / Kavach', dosage: '2g/L water, repeat every 7-10 days' },
      { action: 'Use mancozeb for protective treatment.', product: 'Dithane M-45 / Indofil M-45', dosage: '2.5g/L water' },
      { action: 'Apply azoxystrobin for systemic action.', product: 'Amistar / Quadris', dosage: '1ml/L, max 4 applications per season' },
    ],
    prevention: [
      { action: 'Rotate crops — do not plant tomato/potato in same field for 2 years.' },
      { action: 'Use certified disease-free seeds or resistant varieties (e.g., Mountain Supreme).' },
      { action: 'Apply mulch to prevent soil splash onto lower leaves.' },
      { action: 'Maintain potassium levels through soil testing and appropriate fertilization.' },
    ],
  },

  'Tomato___Late_blight': {
    immediate: [
      { action: 'URGENT: Remove and bag all affected plant material — do not compost.' },
      { action: 'Apply fungicide immediately; late blight spreads rapidly in cool/wet weather.' },
      { action: 'Alert neighboring farmers — late blight is highly infectious.' },
    ],
    organic: [
      { action: 'Copper hydroxide spray.', product: 'Kocide 3000 / Blue Shield', dosage: '3g/L, spray every 5-7 days during wet weather' },
    ],
    chemical: [
      { action: 'Apply metalaxyl + mancozeb immediately.', product: 'Ridomil Gold MZ / Folio Gold', dosage: '2.5g/L water, spray systemically' },
      { action: 'Use cymoxanil for fast knockdown.', product: 'Curzate / Cymbal', dosage: '0.6g/L water' },
      { action: 'Apply dimethomorph for resistant strains.', product: 'Acrobat MZ', dosage: '2.5g/L' },
    ],
    prevention: [
      { action: 'Plant resistant varieties: Mountain Magic, Defiant, Legend.' },
      { action: 'Ensure excellent drainage; avoid waterlogged soil.' },
      { action: 'Scout fields twice weekly during cool/wet periods (10-20°C, >80% humidity).' },
    ],
  },

  'Corn___Common_rust': {
    immediate: [
      { action: 'Scout field immediately to assess spread percentage.' },
      { action: 'If >10% leaf area affected, apply fungicide within 48 hours.' },
    ],
    organic: [
      { action: 'Apply sulfur dust to affected area.', product: 'Micronized Sulfur / Kumulus DF', dosage: '3kg/acre' },
    ],
    chemical: [
      { action: 'Apply triazole fungicide at tassel emergence.', product: 'Tilt / Propiconazole 25 EC', dosage: '1ml/L water' },
      { action: 'Use strobilurin fungicide.', product: 'Headline / Pyraclostrobin', dosage: '1.5ml/L' },
    ],
    prevention: [
      { action: 'Plant rust-resistant hybrids for your region.' },
      { action: 'Early planting to avoid high-rust-pressure periods.' },
    ],
  },

  'Potato___Late_blight': {
    immediate: [
      { action: 'CRITICAL: Destroy infected plants by burning or deep burial (45cm+).' },
      { action: 'Do NOT leave infected tubers in the field.' },
      { action: 'Immediately notify neighbors — this is highly contagious.' },
    ],
    organic: [
      { action: 'Copper-based spray as protective measure.', product: 'Bordeaux Mixture', dosage: '10L/100m², weekly' },
    ],
    chemical: [
      { action: 'Apply metalaxyl systemically.', product: 'Ridomil Gold / Apron XL', dosage: '2.5g/L' },
      { action: 'Alternate with mancozeb to prevent resistance.', product: 'Dithane M-45', dosage: '2g/L' },
    ],
    prevention: [
      { action: 'Use certified disease-free seed potatoes.' },
      { action: 'Hill soil around plants to protect tubers from spores.' },
      { action: 'Destroy volunteer potato plants in off-season.' },
    ],
  },

  'Tomato___Spider_mites': {
    immediate: [
      { action: 'Spray plants forcefully with water to knock off mites.' },
      { action: 'Isolate badly infested plants immediately.' },
    ],
    organic: [
      { action: 'Apply neem oil with insecticidal soap.', product: 'Neem Oil + Safer Soap', dosage: '5ml + 5ml per liter, spray undersides of leaves' },
      { action: 'Release predatory mites.', product: 'Phytoseiulus persimilis / Neoseiulus californicus', dosage: '50 mites/m²' },
    ],
    chemical: [
      { action: 'Apply abamectin miticide.', product: 'Vertimec / Agrimec', dosage: '0.5ml/L water' },
      { action: 'Use spiromesifen.', product: 'Oberon SC', dosage: '1ml/L' },
    ],
    prevention: [
      { action: 'Maintain adequate soil moisture — spider mites thrive in drought stress.' },
      { action: 'Avoid excess nitrogen fertilization.' },
      { action: 'Remove crop debris after harvest.' },
    ],
  },

  'Grape___Black_rot': {
    immediate: [
      { action: 'Remove all mummified berries and infected shoots.' },
      { action: 'Improve canopy airflow by pruning.' },
    ],
    organic: [
      { action: 'Apply copper sulfate spray.', product: 'Copper Octanoate / Cueva', dosage: '5ml/L, 14-day intervals' },
    ],
    chemical: [
      { action: 'Apply myclobutanil at early bloom.', product: 'Rally 40WSP', dosage: '0.4g/L' },
      { action: 'Use captan for protective coverage.', product: 'Captan 50WP', dosage: '3g/L' },
    ],
    prevention: [
      { action: 'Prune vines to ensure open canopy and good air circulation.' },
      { action: 'Begin fungicide program at bud break in areas with history of disease.' },
    ],
  },

  'Unknown': {
    immediate: [
      { action: 'Collect a sample of the affected plant material (leaves/stems/fruit).' },
      { action: 'Photograph the damage pattern and submit to your local agricultural extension officer.' },
      { action: 'Isolate affected area to prevent potential spread.' },
    ],
    organic: [
      { action: 'Apply broad-spectrum neem oil as a precautionary measure.', product: 'Neem Oil 300ppm', dosage: '5ml/L every 7 days' },
    ],
    chemical: [
      { action: 'Consult your local agri-supply store with photos before applying chemicals.', product: null },
    ],
    prevention: [
      { action: 'Keep a crop journal — record when/where you see unusual symptoms.' },
      { action: 'Ensure adequate plant nutrition; stressed plants are more disease-prone.' },
    ],
  },
};

// Pest severity mapping for alert system
export const PEST_SEVERITY_MAP = {
  'Tomato___Late_blight':    'critical',
  'Potato___Late_blight':    'critical',
  'Tomato___Early_blight':   'high',
  'Corn___Common_rust':      'high',
  'Grape___Black_rot':       'high',
  'Tomato___Spider_mites':   'medium',
  'Cherry___Powdery_mildew': 'medium',
  'Squash___Powdery_mildew': 'medium',
};

// Human-readable display names
export const PEST_DISPLAY_NAMES = {
  'Tomato___Early_blight':          'Tomato Early Blight',
  'Tomato___Late_blight':           'Tomato Late Blight',
  'Tomato___Spider_mites':          'Spider Mites (Tomato)',
  'Corn___Common_rust':             'Corn Common Rust',
  'Potato___Late_blight':           'Potato Late Blight',
  'Grape___Black_rot':              'Grape Black Rot',
  'Orange___Haunglongbing_(Citrus_greening)': 'Citrus Greening (HLB)',
};

export function getDisplayName(pestClass) {
  return PEST_DISPLAY_NAMES[pestClass] || pestClass.replace(/___/g, ' ').replace(/_/g, ' ');
}
