// Mock diagnostic data structure
// Based on offline.html Diagnostics component

export const diagnosticsMockData = {
  // Level 1 - WHAT the student knows
  table1: [
    {
      subject: 'PHYSICS',
      indAcc: 72,
      grandAcc: 68,
      drop: 4,
      wrong: 18,
      left: 10,
      il: 45,
      ilMeaning: 'Healthy NEET maturity',
    },
    {
      subject: 'CHEMISTRY',
      indAcc: 78,
      grandAcc: 75,
      drop: 3,
      wrong: 15,
      left: 7,
      il: 35,
      ilMeaning: 'Aggressive but manageable',
    },
    {
      subject: 'MATHEMATICS',
      indAcc: 65,
      grandAcc: 60,
      drop: 5,
      wrong: 22,
      left: 13,
      il: 48,
      ilMeaning: 'Healthy NEET maturity',
    },
    {
      subject: 'BIOLOGY',
      indAcc: 82,
      grandAcc: 80,
      drop: 2,
      wrong: 12,
      left: 6,
      il: 30,
      ilMeaning: 'Aggressive but manageable',
    },
  ],

  table2: [
    // Top 40 weakest subtopics
    {
      subject: 'PHYSICS',
      topic: 'Mechanics',
      subtopic: 'Rotational Motion',
      iass: 45,
      gass: 42,
      ci: 44,
      band: 'Critical',
    },
    {
      subject: 'CHEMISTRY',
      topic: 'Organic Chemistry',
      subtopic: 'Reaction Mechanisms',
      iass: 48,
      gass: 46,
      ci: 47,
      band: 'High Priority',
    },
    {
      subject: 'MATHEMATICS',
      topic: 'Calculus',
      subtopic: 'Integration by Parts',
      iass: 52,
      gass: 49,
      ci: 51,
      band: 'High Priority',
    },
    {
      subject: 'PHYSICS',
      topic: 'Electromagnetism',
      subtopic: 'Electromagnetic Induction',
      iass: 55,
      gass: 53,
      ci: 54,
      band: 'Moderate',
    },
    {
      subject: 'CHEMISTRY',
      topic: 'Physical Chemistry',
      subtopic: 'Chemical Kinetics',
      iass: 58,
      gass: 56,
      ci: 57,
      band: 'Moderate',
    },
    {
      subject: 'MATHEMATICS',
      topic: 'Algebra',
      subtopic: 'Quadratic Equations',
      iass: 60,
      gass: 58,
      ci: 59,
      band: 'Moderate',
    },
    {
      subject: 'BIOLOGY',
      topic: 'Genetics',
      subtopic: 'DNA Replication',
      iass: 62,
      gass: 60,
      ci: 61,
      band: 'Low',
    },
    {
      subject: 'PHYSICS',
      topic: 'Modern Physics',
      subtopic: 'Photoelectric Effect',
      iass: 65,
      gass: 63,
      ci: 64,
      band: 'Low',
    },
    // ... more subtopics (showing 8 out of 40)
  ],

  // Level 2 - WHY the student is lagging
  table3: [
    {
      subject: 'PHYSICS',
      cmsi: 68,
      types: {
        'Theoretical': { I: 75, G: 72 },
        'Conceptual': { I: 70, G: 65 },
        'Applicative': { I: 65, G: 62 },
        'Mathematical': { I: 60, G: 58 },
        'Multi Concept': { I: 58, G: 55 },
      },
    },
    {
      subject: 'CHEMISTRY',
      cmsi: 72,
      types: {
        'Theoretical': { I: 80, G: 78 },
        'Conceptual': { I: 75, G: 72 },
        'Applicative': { I: 70, G: 68 },
        'Mathematical': { I: 68, G: 65 },
        'Multi Concept': { I: 65, G: 62 },
      },
    },
    {
      subject: 'MATHEMATICS',
      cmsi: 65,
      types: {
        'Theoretical': { I: 70, G: 68 },
        'Conceptual': { I: 68, G: 65 },
        'Applicative': { I: 62, G: 58 },
        'Mathematical': { I: 58, G: 55 },
        'Multi Concept': { I: 55, G: 52 },
      },
    },
    {
      subject: 'BIOLOGY',
      cmsi: 78,
      types: {
        'Theoretical': { I: 85, G: 82 },
        'Conceptual': { I: 82, G: 80 },
        'Applicative': { I: 78, G: 75 },
        'Mathematical': { I: 72, G: 70 },
        'Multi Concept': { I: 70, G: 68 },
      },
    },
  ],

  table4: [
    {
      subject: 'PHYSICS',
      cdai: 70,
      levels: {
        'Easy': { I: 85, G: 82 },
        'Moderate': { I: 72, G: 68 },
        'Difficult': { I: 58, G: 55 },
        'Hard': { I: 45, G: 42 },
      },
    },
    {
      subject: 'CHEMISTRY',
      cdai: 75,
      levels: {
        'Easy': { I: 88, G: 85 },
        'Moderate': { I: 78, G: 75 },
        'Difficult': { I: 65, G: 62 },
        'Hard': { I: 52, G: 48 },
      },
    },
    {
      subject: 'MATHEMATICS',
      cdai: 67,
      levels: {
        'Easy': { I: 82, G: 78 },
        'Moderate': { I: 68, G: 65 },
        'Difficult': { I: 55, G: 52 },
        'Hard': { I: 42, G: 38 },
      },
    },
    {
      subject: 'BIOLOGY',
      cdai: 80,
      levels: {
        'Easy': { I: 90, G: 88 },
        'Moderate': { I: 82, G: 80 },
        'Difficult': { I: 72, G: 70 },
        'Hard': { I: 60, G: 58 },
      },
    },
  ],

  // Level 3 - HOW & WHERE to improve
  table5: [
    {
      subject: 'PHYSICS',
      topic: 'Mechanics',
      subtopic: 'Rotational Motion',
      cmsi: 44,
      cdai: 42,
      ew: 5,
      sipi: 280,
      priority: 'Critical',
    },
    {
      subject: 'CHEMISTRY',
      topic: 'Organic Chemistry',
      subtopic: 'Reaction Mechanisms',
      cmsi: 47,
      cdai: 46,
      ew: 5,
      sipi: 265,
      priority: 'Critical',
    },
    {
      subject: 'MATHEMATICS',
      topic: 'Calculus',
      subtopic: 'Integration by Parts',
      cmsi: 51,
      cdai: 49,
      ew: 4,
      sipi: 220,
      priority: 'High',
    },
    {
      subject: 'PHYSICS',
      topic: 'Electromagnetism',
      subtopic: 'Electromagnetic Induction',
      cmsi: 54,
      cdai: 53,
      ew: 4,
      sipi: 198,
      priority: 'High',
    },
    {
      subject: 'CHEMISTRY',
      topic: 'Physical Chemistry',
      subtopic: 'Chemical Kinetics',
      cmsi: 57,
      cdai: 56,
      ew: 3,
      sipi: 165,
      priority: 'Moderate',
    },
    {
      subject: 'MATHEMATICS',
      topic: 'Algebra',
      subtopic: 'Quadratic Equations',
      cmsi: 59,
      cdai: 58,
      ew: 3,
      sipi: 148,
      priority: 'Moderate',
    },
    {
      subject: 'BIOLOGY',
      topic: 'Genetics',
      subtopic: 'DNA Replication',
      cmsi: 61,
      cdai: 60,
      ew: 2,
      sipi: 120,
      priority: 'Low',
    },
    {
      subject: 'PHYSICS',
      topic: 'Modern Physics',
      subtopic: 'Photoelectric Effect',
      cmsi: 64,
      cdai: 63,
      ew: 2,
      sipi: 95,
      priority: 'Low',
    },
  ],
}

// Helper to generate more mock data if needed
export function generateMoreSubtopics(count = 40) {
  const subjects = ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'BIOLOGY']
  const bands = ['Critical', 'High Priority', 'Moderate', 'Low']
  const subtopics = diagnosticsMockData.table2.slice()

  while (subtopics.length < count) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)]
    const band = bands[Math.floor(Math.random() * bands.length)]
    const iass = 40 + Math.floor(Math.random() * 35)
    const gass = iass - Math.floor(Math.random() * 5)
    const ci = Math.floor(iass * 0.6 + gass * 0.4)

    subtopics.push({
      subject,
      topic: `Topic ${subtopics.length + 1}`,
      subtopic: `Subtopic ${subtopics.length + 1}`,
      iass,
      gass,
      ci,
      band,
    })
  }

  return subtopics.slice(0, count)
}

export default diagnosticsMockData
