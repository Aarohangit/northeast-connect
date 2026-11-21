// Static reference data bundled with the app so it is available offline.
// SHELTERS and ALERT are sample data for the demo; in production they come
// from the state disaster management authorities.

export const STATES = [
  { code: 'AR', name: 'Arunachal Pradesh', center: [27.6, 93.6], districts: ['Changlang', 'East Siang', 'Itanagar Capital Complex', 'Lohit', 'Lower Dibang Valley', 'Lower Subansiri', 'Namsai', 'Papum Pare', 'Tawang', 'Tirap', 'Upper Siang', 'West Siang'] },
  { code: 'AS', name: 'Assam', center: [26.3, 92.9], districts: ['Barpeta', 'Bongaigaon', 'Cachar', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Goalpara', 'Golaghat', 'Jorhat', 'Kamrup', 'Kamrup Metro', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar', 'Sonitpur', 'Tinsukia'] },
  { code: 'MN', name: 'Manipur', center: [24.7, 93.9], districts: ['Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching', 'Noney', 'Senapati', 'Tamenglong', 'Thoubal', 'Ukhrul'] },
  { code: 'ML', name: 'Meghalaya', center: [25.5, 91.3], districts: ['East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'Ri-Bhoi', 'South Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'] },
  { code: 'MZ', name: 'Mizoram', center: [23.4, 92.8], districts: ['Aizawl', 'Champhai', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Serchhip', 'Siaha'] },
  { code: 'NL', name: 'Nagaland', center: [26.1, 94.4], districts: ['Dimapur', 'Kohima', 'Mokokchung', 'Mon', 'Peren', 'Phek', 'Tuensang', 'Wokha', 'Zunheboto'] },
  { code: 'SK', name: 'Sikkim', center: [27.5, 88.5], districts: ['Gangtok', 'Gyalshing', 'Mangan', 'Namchi', 'Pakyong', 'Soreng'] },
  { code: 'TR', name: 'Tripura', center: [23.8, 91.7], districts: ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'] },
]

export const stateOf = (code) => STATES.find((s) => s.code === code)
export const stateForDistrict = (district) => STATES.find((s) => s.districts.includes(district))

export const NE_CENTER = [25.9, 92.9]

export const HELPLINES = [
  { number: '112', key: 'h112' },
  { number: '108', key: 'h108' },
  { number: '1070', key: 'h1070' },
  { number: '1077', key: 'h1077' },
]

export const HAZARDS = ['flood', 'landslide', 'earthquake']

export const SAFETY = {
  flood: { dos: ['do1', 'do2', 'do3', 'do4', 'do5'], donts: ['dont1', 'dont2', 'dont3', 'dont4', 'dont5'] },
  landslide: { dos: ['ls_do1', 'ls_do2', 'ls_do3', 'ls_do4', 'ls_do5'], donts: ['ls_dont1', 'ls_dont2', 'ls_dont3', 'ls_dont4', 'ls_dont5'] },
  earthquake: { dos: ['eq_do1', 'eq_do2', 'eq_do3', 'eq_do4', 'eq_do5'], donts: ['eq_dont1', 'eq_dont2', 'eq_dont3', 'eq_dont4', 'eq_dont5'] },
}

export const ALERT = {
  sample: true,
  issuedAt: '2026-11-21T05:30:00Z',
  text: {
    en: 'Heavy rain: high landslide risk in the hills of Mizoram, Meghalaya, Manipur and Sikkim. Brahmaputra above danger level in parts of Assam. Avoid hill roads and riverbanks.',
    hi: 'भारी बारिश: मिज़ोरम, मेघालय, मणिपुर और सिक्किम की पहाड़ियों में भूस्खलन का ख़तरा अधिक। असम के कुछ हिस्सों में ब्रह्मपुत्र ख़तरे के निशान से ऊपर। पहाड़ी सड़कों और नदी किनारों से दूर रहें।',
    as: 'প্ৰবল বৰষুণ: মিজোৰাম, মেঘালয়, মণিপুৰ আৰু ছিকিমৰ পাহাৰত ভূমিস্খলনৰ উচ্চ আশংকা। অসমৰ কিছু অংশত ব্ৰহ্মপুত্ৰ বিপদসীমাৰ ওপৰত। পাহাৰীয়া ৰাস্তা আৰু নদীৰ পাৰৰ পৰা আঁতৰি থাকক।',
  },
}

export const SHELTERS = [
  { id: 1, state: 'AS', name: 'Barpeta Town HS School Relief Camp', district: 'Barpeta', latitude: 26.3226, longitude: 91.0063, capacity: 600, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 2, state: 'AS', name: 'Morigaon College Relief Camp', district: 'Morigaon', latitude: 26.2530, longitude: 92.3421, capacity: 500, facilities: ['food', 'water', 'medical'] },
  { id: 3, state: 'AS', name: 'Dhemaji Govt. Boys HS School', district: 'Dhemaji', latitude: 27.4810, longitude: 94.5780, capacity: 450, facilities: ['food', 'water', 'medical'] },
  { id: 4, state: 'AS', name: 'Sarusajai Indoor Stadium', district: 'Kamrup Metro', latitude: 26.1360, longitude: 91.7710, capacity: 1200, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 5, state: 'AS', name: 'Silchar Normal School Camp', district: 'Cachar', latitude: 24.8270, longitude: 92.7980, capacity: 400, facilities: ['food', 'water'] },
  { id: 6, state: 'MZ', name: 'Aizawl Vanapa Hall Relief Centre', district: 'Aizawl', latitude: 23.7290, longitude: 92.7190, capacity: 350, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 7, state: 'MZ', name: 'Lunglei Community Hall', district: 'Lunglei', latitude: 22.8840, longitude: 92.7340, capacity: 200, facilities: ['food', 'water'] },
  { id: 8, state: 'ML', name: 'Shillong Polo Ground Shelter', district: 'East Khasi Hills', latitude: 25.5860, longitude: 91.8890, capacity: 700, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 9, state: 'ML', name: 'Tura Govt. HS School Camp', district: 'West Garo Hills', latitude: 25.5140, longitude: 90.2200, capacity: 300, facilities: ['food', 'water'] },
  { id: 10, state: 'MN', name: 'Imphal Khuman Lampak Relief Camp', district: 'Imphal East', latitude: 24.8150, longitude: 93.9500, capacity: 900, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 11, state: 'MN', name: 'Noney Block Office Shelter', district: 'Noney', latitude: 24.8530, longitude: 93.6220, capacity: 150, facilities: ['food', 'medical'] },
  { id: 12, state: 'SK', name: 'Mangan Community Hall', district: 'Mangan', latitude: 27.5100, longitude: 88.5300, capacity: 180, facilities: ['food', 'water', 'power'] },
  { id: 13, state: 'SK', name: 'Gangtok Paljor Stadium Shelter', district: 'Gangtok', latitude: 27.3280, longitude: 88.6120, capacity: 600, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 14, state: 'AR', name: 'Itanagar IG Park Relief Camp', district: 'Itanagar Capital Complex', latitude: 27.0844, longitude: 93.6053, capacity: 400, facilities: ['food', 'water', 'medical'] },
  { id: 15, state: 'AR', name: 'Pasighat Govt. College Camp', district: 'East Siang', latitude: 28.0660, longitude: 95.3260, capacity: 300, facilities: ['food', 'water'] },
  { id: 16, state: 'NL', name: 'Kohima Local Ground Shelter', district: 'Kohima', latitude: 25.6700, longitude: 94.1080, capacity: 400, facilities: ['food', 'water', 'medical'] },
  { id: 17, state: 'NL', name: 'Dimapur Town Hall Camp', district: 'Dimapur', latitude: 25.9060, longitude: 93.7270, capacity: 500, facilities: ['food', 'water', 'power'] },
  { id: 18, state: 'TR', name: 'Agartala Umakanta Academy Camp', district: 'West Tripura', latitude: 23.8360, longitude: 91.2800, capacity: 650, facilities: ['food', 'water', 'medical', 'power'] },
  { id: 19, state: 'TR', name: 'Udaipur Town Hall Shelter', district: 'Gomati', latitude: 23.5330, longitude: 91.4870, capacity: 250, facilities: ['food', 'water'] },
]
