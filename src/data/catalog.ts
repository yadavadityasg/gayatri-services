// Mock data for services, products, technicians, AMC, testimonials.
// All prices in INR.

export type ServiceCategory =
  | "ac" | "refrigerator" | "washing-machine" | "cooler"
  | "geyser" | "tv" | "ro" | "microwave" | "chimney" | "dishwasher";

export interface RepairService {
  slug: string;
  category: ServiceCategory;
  categoryLabel: string;
  name: string;
  short: string;
  startingAt: number;
  duration: string;
  icon: string;
  includes: string[];
  problems: string[];
}

export const CATEGORIES: { id: ServiceCategory; label: string; icon: string }[] = [
  { id: "ac", label: "AC", icon: "snowflake" },
  { id: "refrigerator", label: "Refrigerator", icon: "fridge" },
  { id: "washing-machine", label: "Washing Machine", icon: "washing" },
  { id: "cooler", label: "Cooler", icon: "wind" },
  { id: "geyser", label: "Geyser", icon: "flame" },
  { id: "tv", label: "TV", icon: "tv" },
  { id: "ro", label: "RO / Water Purifier", icon: "droplet" },
  { id: "microwave", label: "Microwave", icon: "microwave" },
  { id: "chimney", label: "Chimney", icon: "fan" },
  { id: "dishwasher", label: "Dishwasher", icon: "utensils" },
];

export const SERVICES: RepairService[] = [
  { slug: "ac-repair", category: "ac", categoryLabel: "AC", name: "AC Repair", short: "Diagnose & fix any AC issue", startingAt: 499, duration: "60–90 min", icon: "snowflake",
    includes: ["Inspection & diagnosis","Gas pressure check","Filter cleaning","Electrical connection check","Test run after repair"],
    problems: ["AC not cooling","AC making noise","AC leaking water","Remote not working","AC not turning on"] },
  { slug: "ac-service", category: "ac", categoryLabel: "AC", name: "AC Deep Cleaning", short: "Full chemical wash & service", startingAt: 599, duration: "60 min", icon: "snowflake",
    includes: ["Indoor coil cleaning","Filter wash","Drain pipe flush","Outdoor unit cleaning (+₹200)","Performance check"], problems: ["AC giving low cooling","Bad smell from AC","Dust on filters"] },
  { slug: "ac-installation", category: "ac", categoryLabel: "AC", name: "AC Installation", short: "Per indoor + outdoor unit", startingAt: 799, duration: "90 min", icon: "snowflake",
    includes: ["Bracket fitting","Copper piping (3m)","Drain pipe","Wiring","Gas charging check"], problems: ["New AC purchase","Shifting AC","Wall mounting"] },
  { slug: "ac-gas-refill", category: "ac", categoryLabel: "AC", name: "AC Gas Refill", short: "1–1.5 Ton ₹1299 · 2 Ton ₹1499", startingAt: 1299, duration: "60 min", icon: "snowflake",
    includes: ["Leak check","Vacuuming","R32/R410 gas refill","Pressure test"], problems: ["Low cooling","Ice on coils","Compressor running but no cooling"] },
  { slug: "fridge-repair", category: "refrigerator", categoryLabel: "Refrigerator", name: "Refrigerator Repair", short: "Single & double door experts", startingAt: 499, duration: "45–90 min", icon: "fridge",
    includes: ["Cooling diagnosis","Compressor check","Thermostat test","Door seal check","Defrost system test"], problems: ["Not cooling","Water leaking","Strange noise","Ice build-up","Light not working"] },
  { slug: "washing-repair", category: "washing-machine", categoryLabel: "Washing Machine", name: "Washing Machine Repair", short: "Front, top, semi-auto", startingAt: 399, duration: "45 min", icon: "washing",
    includes: ["Drum inspection","Motor check","Drain pump test","Inlet valve check","PCB diagnosis"], problems: ["Not spinning","Water not draining","Noise while spinning","Door not locking","Display error"] },
  { slug: "cooler-repair", category: "cooler", categoryLabel: "Cooler", name: "Cooler Repair", short: "Pump, motor, fan service", startingAt: 349, duration: "45 min", icon: "wind",
    includes: ["Motor check","Pump test","Pad cleaning","Wiring inspection"], problems: ["No air flow","Pump not working","Water leak"] },
  { slug: "geyser-repair", category: "geyser", categoryLabel: "Geyser", name: "Geyser Repair", short: "Storage & instant types", startingAt: 349, duration: "45 min", icon: "flame",
    includes: ["Element check","Thermostat test","Anode rod inspection","Leakage test"], problems: ["Not heating","Water leak","Tripping MCB"] },
  { slug: "tv-repair", category: "tv", categoryLabel: "TV", name: "TV Repair", short: "LED, LCD & smart TVs", startingAt: 399, duration: "60 min", icon: "tv",
    includes: ["Display diagnosis","Motherboard check","Backlight test","Speaker test"], problems: ["No display","Lines on screen","No sound","Won't turn on"] },
  { slug: "ro-service", category: "ro", categoryLabel: "RO", name: "RO / Water Purifier Service", short: "Filter change & sanitisation", startingAt: 399, duration: "45 min", icon: "droplet",
    includes: ["Pre-filter change","Sediment filter check","Membrane inspection","Tank sanitisation"], problems: ["Slow water flow","Bad taste","TDS too high","Leakage"] },
  { slug: "microwave-repair", category: "microwave", categoryLabel: "Microwave", name: "Microwave Repair", short: "Solo, grill & convection", startingAt: 299, duration: "45 min", icon: "microwave",
    includes: ["Magnetron check","Door switch test","Turntable motor","Control panel test"], problems: ["Not heating","Sparking inside","Door not closing","Buttons not working"] },
];

export interface AmcPlan {
  id: string; name: string; price: number; period: string;
  appliances: string; services: string; tagline: string; highlight?: boolean;
  benefits: string[];
}
export const AMC_PLANS: AmcPlan[] = [
  { id: "silver", name: "Silver", price: 1499, period: "year", appliances: "1 appliance", services: "2 services / year", tagline: "Best for single AC homes",
    benefits: ["Priority booking","2 scheduled services","Free filter cleaning","10% off on spare parts","Phone support"] },
  { id: "gold", name: "Gold", price: 2999, period: "year", appliances: "2 appliances", services: "4 services / year", tagline: "Most popular", highlight: true,
    benefits: ["Priority booking","4 scheduled services","Free minor spare parts","20% off on major repairs","Free filter cleaning","WhatsApp support"] },
  { id: "platinum", name: "Platinum", price: 5999, period: "year", appliances: "Unlimited appliances", services: "Unlimited services", tagline: "Ultimate care",
    benefits: ["Same-day priority","Unlimited services","All minor parts free","30% off on major repairs","Annual deep cleaning","Dedicated relationship manager"] },
];

import techAc from "@/assets/technician-ac.jpg";
import techWash from "@/assets/technician-washing.jpg";
import logoMark from "@/assets/logo-mark.png";

export interface Technician {
  id: string; name: string; specialization: string; experience: number;
  rating: number; jobs: number; onTime: number; photo: string;
  certifications: string[]; ratingBreakdown: number[]; reviews: { name: string; rating: number; text: string }[];
}
export const TECHNICIANS: Technician[] = [
  { id: "TECH-001", name: "Rajesh Kumar", specialization: "AC Specialist", experience: 8, rating: 4.9, jobs: 1240, onTime: 98, photo: techAc,
    certifications: ["LG Authorized","Voltas Certified","ISO Safety Cert."], ratingBreakdown: [1080, 110, 35, 10, 5],
    reviews: [{name:"Priya S.",rating:5,text:"Reached on time, fixed AC in 40 minutes. Very polite."},{name:"Amit J.",rating:5,text:"Honest pricing, no upselling. Highly recommend."}] },
  { id: "TECH-002", name: "Suresh Patel", specialization: "Refrigerator Expert", experience: 6, rating: 4.8, jobs: 980, onTime: 96, photo: techWash,
    certifications: ["Samsung Authorized","Whirlpool Certified"], ratingBreakdown: [820, 110, 30, 12, 8],
    reviews: [{name:"Neha K.",rating:5,text:"Found the exact compressor issue others missed."}] },
  { id: "TECH-003", name: "Amit Verma", specialization: "Multi-Appliance", experience: 5, rating: 4.7, jobs: 756, onTime: 94, photo: techAc,
    certifications: ["IFB Certified","Bosch Trained"], ratingBreakdown: [600, 100, 35, 12, 9],
    reviews: [{name:"Rahul M.",rating:5,text:"Repaired washing machine and microwave same visit."}] },
];

export interface Product {
  id: string; name: string; brand: string; category: ServiceCategory; condition: "New" | "Refurbished" | "Certified Pre-owned";
  price: number; mrp: number; rating: number; reviews: number; image: string; specs: { label: string; value: string }[];
  description: string; box: string[]; warranty: string; capacity?: string; energyRating?: number;
}
const ph = (q: string) => `https://images.unsplash.com/${q}?q=80&w=900&auto=format&fit=crop`;
export const PRODUCTS: Product[] = [
  { id:"P001", name:"1.5 Ton 5 Star Inverter Split AC", brand:"LG", category:"ac", condition:"New", price:32999, mrp:45990, rating:4.6, reviews:1284,
    image: ph("photo-1581275299888-536c7d68f06d"), capacity:"1.5 Ton", energyRating:5,
    specs:[{label:"Capacity",value:"1.5 Ton"},{label:"Star Rating",value:"5 Star"},{label:"Type",value:"Inverter Split"},{label:"Refrigerant",value:"R32"},{label:"Coil",value:"Copper"}],
    description:"LG dual-inverter split AC with 4-in-1 convertible cooling, low-noise operation and Ocean Black Protection.",
    box:["Indoor unit","Outdoor unit","Remote","User manual","Warranty card"], warranty:"1 yr product + 10 yr compressor" },
  { id:"P002", name:"253L Double Door Refrigerator", brand:"Samsung", category:"refrigerator", condition:"New", price:24500, mrp:31900, rating:4.5, reviews:892,
    image: ph("photo-1571175443880-49e1d25b2bc5"), capacity:"253L", energyRating:3,
    specs:[{label:"Capacity",value:"253 L"},{label:"Type",value:"Double Door, Frost Free"},{label:"Star Rating",value:"3 Star"},{label:"Compressor",value:"Digital Inverter"}],
    description:"Convertible 5-in-1 fridge with Digital Inverter compressor for energy savings and quiet operation.",
    box:["Refrigerator","Egg tray","User manual"], warranty:"1 yr product + 10 yr compressor" },
  { id:"P003", name:"1.5 Ton 3 Star Split AC (Refurbished)", brand:"Voltas", category:"ac", condition:"Refurbished", price:18999, mrp:36990, rating:4.3, reviews:212,
    image: ph("photo-1631545308456-cabf45dab95e"), capacity:"1.5 Ton", energyRating:3,
    specs:[{label:"Capacity",value:"1.5 Ton"},{label:"Star Rating",value:"3 Star"},{label:"Condition",value:"Refurbished, like-new"}],
    description:"Factory refurbished and tested across 32 quality checks. Comes with 6-month Gayatri warranty.",
    box:["Indoor unit","Outdoor unit","Remote","Refurb certificate"], warranty:"6 months Gayatri Refurb Warranty" },
  { id:"P004", name:"7 Kg Fully Automatic Top Load Washing Machine", brand:"Whirlpool", category:"washing-machine", condition:"New", price:15500, mrp:19990, rating:4.4, reviews:678,
    image: ph("photo-1626806787461-102c1bfaaea1"),
    specs:[{label:"Capacity",value:"7 Kg"},{label:"Type",value:"Top Load Auto"},{label:"Star Rating",value:"5 Star"}],
    description:"ZPF technology fills 50% faster, 12 wash programs, hard water wash.",
    box:["Washing machine","Inlet pipe","Drain pipe","User manual"], warranty:"2 yr product + 10 yr motor" },
  { id:"P005", name:"45 L Personal Air Cooler", brand:"Symphony", category:"cooler", condition:"New", price:8999, mrp:12990, rating:4.2, reviews:445,
    image: ph("photo-1631545308456-cabf45dab95e"),
    specs:[{label:"Tank",value:"45 L"},{label:"Type",value:"Personal"},{label:"Throw",value:"35 ft"}],
    description:"Honeycomb cooling pads, low power consumption, ice chamber.", box:["Cooler","Remote","User manual"], warranty:"1 yr" },
  { id:"P006", name:"32 inch HD Ready Smart LED TV", brand:"Samsung", category:"tv", condition:"New", price:14999, mrp:21900, rating:4.5, reviews:1521,
    image: ph("photo-1593359677879-a4bb92f829d1"),
    specs:[{label:"Size",value:"32 inch"},{label:"Resolution",value:"HD Ready"},{label:"Smart",value:"Tizen OS"}],
    description:"Crystal HD picture, built-in apps, HDR.", box:["TV","Remote","Stand","User manual"], warranty:"1 yr standard" },
  { id:"P007", name:"15 L Storage Geyser", brand:"Bajaj", category:"geyser", condition:"New", price:6499, mrp:8990, rating:4.3, reviews:332,
    image: ph("photo-1604578762246-41134e37f9cc"),
    specs:[{label:"Capacity",value:"15 L"},{label:"Type",value:"Storage"},{label:"Star Rating",value:"5 Star"}],
    description:"Glass-lined tank, multi-safety system.", box:["Geyser","Mounting kit","User manual"], warranty:"2 yr product + 5 yr tank" },
  { id:"P008", name:"7 L RO + UV + UF Water Purifier", brand:"Kent", category:"ro", condition:"New", price:11999, mrp:17000, rating:4.6, reviews:980,
    image: ph("photo-1548839140-29a749e1cf4d"),
    specs:[{label:"Storage",value:"7 L"},{label:"Purification",value:"RO+UV+UF"},{label:"TDS",value:"Adjustable"}],
    description:"Multi-stage purification, save water tech, mineral RO.", box:["Purifier","Filter set","Pipes","User manual"], warranty:"1 yr + 3 yr free service" },
];

export const BRANDS = ["Samsung","LG","Voltas","Daikin","Hitachi","Blue Star","Whirlpool","Godrej","Haier","IFB","Bosch","Panasonic","Lloyd","Carrier","O'General","Bajaj","Kent","Symphony"];

export const TESTIMONIALS = [
  { name: "Priya Sharma", city: "Andheri, Mumbai", rating: 5, text: "Booked AC service at 9am, technician arrived by 11. Very professional and reasonable pricing.", appliance: "AC Service" },
  { name: "Rohan Mehta", city: "Powai, Mumbai", rating: 5, text: "Bought a refurbished fridge — works like new and saved me ₹8000. Highly recommend.", appliance: "Refurbished Fridge" },
  { name: "Anita Desai", city: "Vashi, Navi Mumbai", rating: 5, text: "Took the Gold AMC plan. Two services already done — peace of mind.", appliance: "AMC Gold" },
  { name: "Vikram Singh", city: "Thane West", rating: 4, text: "Washing machine fixed in one visit. Genuine spare used, 90-day warranty given.", appliance: "Washing Machine Repair" },
];

export const LOGO_MARK = logoMark;
