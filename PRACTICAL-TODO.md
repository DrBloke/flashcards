# Edexcel Chemistry A-Level Core Practicals

Here is the list of the 16 core practicals required for the Edexcel A-Level Chemistry specification that we need to create flashcard decks for:

- [ ] CP 01: Measuring the molar volume of a gas
- [ ] CP 02: Preparation of a standard solution from a solid acid and use it to find the concentration of a solution of sodium hydroxide
- [ ] CP 03: Finding the concentration of a solution of hydrochloric acid
- [ ] CP 04: Investigation of the rates of hydrolysis of some halogenoalkanes
- [ ] CP 05: Oxidation of ethanol
- [ ] CP 06: Chlorination of 2-methylpropan-2-ol with concentrated hydrochloric acid
- [ ] CP 07: Analysis of some inorganic and organic unknowns
- [ ] CP 08: Determination of the enthalpy change of a reaction using Hess’s Law
- [ ] CP 09: Finding the Ka value for a weak acid
- [ ] CP 10: Investigating some electrochemical cells
- [ ] CP 11: Finding the activation energy of a reaction
- [ ] CP 12: Preparation of a transition metal complex
- [ ] CP 13: Following the rate of the iodine-propanone reaction by a titrimetric method
- [ ] CP 14: Following the rate of the iodine-propanone reaction by a continuous monitoring method
- [ ] CP 15: Analysis of some inorganic and organic unknowns (Part 2)
- [ ] CP 16: Preparation of aspirin

## Directory Structure and Naming Convention

The flashcard decks should be stored in the existing `src/data/decks` (or equivalent data folder where decks are currently stored).

The directory structure and naming should be as follows:

```text
src/
└── decks/
    └── chemistry-a-level-practicals/
        ├── 01-molar-volume.json
        ├── 02-standard-solution.json
        ├── 03-hcl-concentration.json
        ├── 04-hydrolysis-rates.json
        ├── 05-oxidation-ethanol.json
        ├── 06-chlorination-alcohol.json
        ├── 07-analysis-unknowns-1.json
        ├── 08-enthalpy-change.json
        ├── 09-ka-weak-acid.json
        ├── 10-electrochemical-cells.json
        ├── 11-activation-energy.json
        ├── 12-transition-metal-complex.json
        ├── 13-rate-iodine-propanone-titration.json
        ├── 14-rate-iodine-propanone-continuous.json
        ├── 15-analysis-unknowns-2.json
        └── 16-preparation-aspirin.json
```

Each deck file should include a unique ID, an appropriate title based on the practical, and cover the specific requirements outlined in our plan (key skills, calculations, errors/improvements, safety, common mistakes).
