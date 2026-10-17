
const tests = [
  {
    id: 1, title: "Test 01", date: "2026-10-11", available: false,
    type: "part",
    syllabus: {
      Physics: ["Mathematical Tools", "Units and Measurements", "Motion in a Straight Line", "Vectors"],
      Chemistry: ["Some Basic Concepts of Chemistry", "Redox Reaction", "Solutions"],
      Botany: ["Cell – The Unit of Life", "Cell Cycle and Cell Division"],
      Zoology: ["Structural Organisation in Animals", "Breathing and Exchange of Gases"]
    }
  },
  {
    id: 2, title: "Test 02", date: "2026-10-18", available: false,
    type: "part",
    syllabus: {
      Physics: ["Motion in a Plane"],
      Chemistry: ["Thermodynamics and Thermochemistry", "Chemical Equilibrium", "Ionic Equilibrium"],
      Botany: ["The Living World", "Biological Classification"],
      Zoology: ["Body Fluids and Circulation"]
    }
  },
  {
    id: 3, title: "Test 03", date: "2026-11-01", available: false,
    type: "part",
    syllabus: {
      Physics: ["Mathematical Tools", "Units and Measurements", "Motion in a Straight Line", "Vectors", "Motion in a Plane"],
      Chemistry: ["Some Basic Concepts of Chemistry", "Redox Reaction", "Solutions", "Thermodynamics and Thermochemistry", "Chemical Equilibrium", "Ionic Equilibrium"],
      Botany: ["Cell – The Unit of Life", "Cell Cycle and Cell Division", "The Living World", "Biological Classification"],
      Zoology: ["Structural Organisation in Animals", "Breathing and Exchange of Gases", "Body Fluids and Circulation"]
    }
  },
  {
    id: 4, title: "Test 04", date: "2026-11-08", available: false,
    type: "part",
    syllabus: {
      Physics: ["Laws of Motion", "Work, Energy and Power", "Centre of Mass and System of Particles"],
      Chemistry: ["Electrochemistry", "Chemical Kinetics"],
      Botany: ["Plant Kingdom"],
      Zoology: ["Excretory Products and their Elimination"]
    }
  },
  {
    id: 5, title: "Test 05", date: "2026-11-22", available: false,
    type: "part",
    syllabus: {
      Physics: ["Rotational Motion", "Gravitation"],
      Chemistry: ["Structure of Atom", "Classification of Elements and Periodicity in Properties"],
      Botany: ["Morphology of Flowering Plants"],
      Zoology: ["Locomotion and Movement"]
    }
  },
  {
    id: 6, title: "Test 06", date: "2026-11-29", available: false,
    type: "part",
    syllabus: {
      Physics: ["Laws of Motion", "Work, Energy and Power", "Centre of Mass and System of Particles", "Rotational Motion", "Gravitation"],
      Chemistry: ["Electrochemistry", "Chemical Kinetics", "Structure of Atom", "Classification of Elements and Periodicity in Properties"],
      Botany: ["Plant Kingdom", "Morphology of Flowering Plants"],
      Zoology: ["Excretory Products and their Elimination", "Locomotion and Movement"]
    }
  },
  {
    id: 7, title: "Test 07", date: "2026-12-13", available: false,
    type: "part",
    syllabus: {
      Physics: ["Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter"],
      Chemistry: ["Chemical Bonding and Molecular Structure", "Organic Chemistry: Some Basic Principles and Techniques – IUPAC Naming"],
      Botany: ["Anatomy of Flowering Plants", "Photosynthesis in Higher Plants"],
      Zoology: ["Neural Control and Coordination"]
    }
  },
  {
    id: 8, title: "Test 08", date: "2026-12-20", available: false,
    type: "part",
    syllabus: {
      Physics: ["Kinetic Theory", "Thermodynamics", "Oscillations"],
      Chemistry: ["Organic Chemistry: Isomerism", "Structural and Geometrical Isomerism", "Cis-trans and Z-E Notation", "CIP Rule", "Conformations and Newman Projections", "Optical Isomerism", "Chiral and Stereogenic Centres", "Fischer Projection", "R/S Configuration"],
      Botany: ["Plant Growth and Development"],
      Zoology: ["Chemical Coordination and Integration"]
    }
  },
  {
    id: 9, title: "Test 09", date: "2027-01-03", available: false,
    type: "part",
    syllabus: {
      Physics: ["Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter", "Kinetic Theory", "Thermodynamics", "Oscillations"],
      Chemistry: ["Chemical Bonding and Molecular Structure", "IUPAC Naming", "Organic Chemistry: Isomerism"],
      Botany: ["Anatomy of Flowering Plants", "Photosynthesis in Higher Plants", "Plant Growth and Development"],
      Zoology: ["Neural Control and Coordination", "Chemical Coordination and Integration"]
    }
  },
  {
    id: 10, title: "Test 10", date: "2027-01-10", available: false,
    type: "part",
    syllabus: {
      Physics: ["Waves", "Electric Charges and Fields", "Electrostatic Potential and Capacitance"],
      Chemistry: ["Organic Chemistry: Some Basic Principles and Techniques (GOC)", "Hydrocarbons"],
      Botany: ["Respiration in Plants"],
      Zoology: ["Animal Kingdom"]
    }
  },
  {
    id: 11, title: "Test 11", date: "2027-01-24", available: false,
    type: "part",
    syllabus: {
      Physics: ["Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter"],
      Chemistry: ["Haloalkanes and Haloarenes", "Alcohols, Ethers and Phenols"],
      Botany: ["Sexual Reproduction in Flowering Plants"],
      Zoology: ["Biomolecules"]
    }
  },
  {
    id: 12, title: "Test 12", date: "2027-01-31", available: false,
    type: "part",
    syllabus: {
      Physics: ["Waves", "Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter"],
      Chemistry: ["GOC", "Hydrocarbons", "Haloalkanes and Haloarenes", "Alcohols, Ethers and Phenols"],
      Botany: ["Respiration in Plants", "Sexual Reproduction in Flowering Plants"],
      Zoology: ["Animal Kingdom", "Biomolecules"]
    }
  },
  {
    id: 13, title: "Test 13", date: "2027-02-14", available: false,
    type: "part",
    syllabus: {
      Physics: ["Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves"],
      Chemistry: ["Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules"],
      Botany: ["Principles of Inheritance and Variation", "Microbes in Human Welfare"],
      Zoology: ["Human Reproduction"]
    }
  },
  {
    id: 14, title: "Test 14", date: "2027-02-28", available: false,
    type: "part",
    syllabus: {
      Physics: ["Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter"],
      Chemistry: ["Purification and Qualitative and Quantitative Analysis", "Coordination Compounds", "The d- and f-Block Elements"],
      Botany: ["Organisms and Populations", "Ecosystem"],
      Zoology: ["Reproductive Health"]
    }
  },

  ...[
    ["2027-03-07", "Test 15"],
    ["2027-03-14", "Test 16"],
    ["2027-03-21", "Test 17"],
    ["2027-03-28", "Test 18"],
    ["2027-04-04", "Test 19"],
    ["2027-04-11", "Test 20"],
    ["2027-04-18", "Test 21"],
    ["2027-04-25", "Test 22"],
    ["2027-04-30", "Test 23"]
  ].map(([date, title], index) => ({
    id: index + 15,
    title,
    date,
    available: false,
    type: "full",
    syllabus: {
      Physics: ["Complete NEET Physics syllabus"],
      Chemistry: ["Complete NEET Chemistry syllabus"],
      Botany: ["Complete NEET Botany syllabus"],
      Zoology: ["Complete NEET Zoology syllabus"]
    }
  }))
];
