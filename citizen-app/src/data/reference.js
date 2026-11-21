// Static reference data bundled with the app so it is available offline.
// SHELTERS and ALERT are sample data for the demo; in production they would be
// synced from the district administration feed.

export const DISTRICTS = [
  'Barpeta', 'Bongaigaon', 'Cachar', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Goalpara',
  'Golaghat', 'Jorhat', 'Kamrup', 'Kamrup Metro', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon',
  'Nalbari', 'Sivasagar', 'Sonitpur', 'Tinsukia',
]

export const HELPLINES = [
  { number: '112', key: 'h112' },
  { number: '1070', key: 'h1070' },
  { number: '1077', key: 'h1077' },
]

export const ALERT = {
  sample: true,
  issuedAt: '2026-11-21T05:30:00Z',
  level: 'severe',
  text: {
    en: 'Brahmaputra and tributaries above danger level in Barpeta, Morigaon and Dhemaji. Move to higher ground if water is rising near you.',
    hi: 'बारपेटा, मोरीगाँव और धेमाजी में ब्रह्मपुत्र और सहायक नदियाँ ख़तरे के निशान से ऊपर। पानी बढ़ रहा हो तो ऊँची जगह पर जाएँ।',
    as: 'বৰপেটা, মৰিগাঁও আৰু ধেমাজিত ব্ৰহ্মপুত্ৰ আৰু উপনৈসমূহ বিপদসীমাৰ ওপৰত। ওচৰত পানী বাঢ়িলে ওখ ঠাইলৈ যাওক।',
  },
}

export const SHELTERS = [
  { id: 1, name: 'Barpeta Town HS School Relief Camp', district: 'Barpeta', latitude: 26.3226, longitude: 91.0063, capacity: 600, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 2, name: 'Howly Higher Secondary School', district: 'Barpeta', latitude: 26.4247, longitude: 90.9789, capacity: 350, facilities: ['food', 'water'] },
  { id: 3, name: 'Morigaon College Relief Camp', district: 'Morigaon', latitude: 26.2530, longitude: 92.3421, capacity: 500, facilities: ['food', 'water', 'medical'] },
  { id: 4, name: 'Jagiroad Community Hall', district: 'Morigaon', latitude: 26.1170, longitude: 92.2050, capacity: 250, facilities: ['food', 'power'] },
  { id: 5, name: 'Dhemaji Govt. Boys HS School', district: 'Dhemaji', latitude: 27.4810, longitude: 94.5780, capacity: 450, facilities: ['food', 'water', 'medical'] },
  { id: 6, name: 'North Lakhimpur Stadium Shelter', district: 'Lakhimpur', latitude: 27.2370, longitude: 94.1030, capacity: 800, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 7, name: 'Sarusajai Indoor Stadium', district: 'Kamrup Metro', latitude: 26.1360, longitude: 91.7710, capacity: 1200, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 8, name: 'Nagaon Nowgong College Camp', district: 'Nagaon', latitude: 26.3470, longitude: 92.6850, capacity: 400, facilities: ['food', 'water'] },
]
