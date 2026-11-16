/**
 * The published research behind scoring version 2.0.0. Each finding in the
 * interface copy (ui-strings: landing.science.findings and how.research) is
 * paired, by position, with the references in FINDING_REFS.
 *
 * Citations stay in their original language. Keep claims to what the studies
 * report; anything that's reasoning rather than evidence is labelled as such
 * where it's described.
 */

export interface Reference {
  /** "Author, Year" for inline use. */
  short: string;
  /** Full citation (APA style). */
  full: string;
}

export const REFERENCES = {
  christensen1990: {
    short: 'Christensen & Heavey, 1990',
    full: 'Christensen, A., & Heavey, C. L. (1990). Gender and social structure in the demand/withdraw pattern of marital conflict. Journal of Personality and Social Psychology, 59(1), 73–81.',
  },
  schrodt2014: {
    short: 'Schrodt, Witt & Shimkowski, 2014',
    full: 'Schrodt, P., Witt, P. L., & Shimkowski, J. R. (2014). A meta-analytical review of the demand/withdraw pattern of interaction and its associations with individual, relational, and communicative outcomes. Communication Monographs, 81(1), 28–58.',
  },
  gottman1994: {
    short: 'Gottman, 1994',
    full: 'Gottman, J. M. (1994). What predicts divorce? The relationship between marital processes and marital outcomes. Lawrence Erlbaum Associates.',
  },
  gottman1993: {
    short: 'Gottman, 1993',
    full: 'Gottman, J. M. (1993). The roles of conflict engagement, escalation, and avoidance in marital interaction: A longitudinal view of five types of couples. Journal of Consulting and Clinical Psychology, 61(1), 6–15.',
  },
  joel2020: {
    short: 'Joel et al., 2020',
    full: 'Joel, S., Eastwick, P. W., Allison, C. J., et al. (2020). Machine learning uncovers the most robust self-report predictors of relationship quality across 43 longitudinal couples studies. Proceedings of the National Academy of Sciences, 117(32), 19061–19071.',
  },
  dyrenforth2010: {
    short: 'Dyrenforth et al., 2010',
    full: 'Dyrenforth, P. S., Kashy, D. A., Donnellan, M. B., & Lucas, R. E. (2010). Predicting relationship and life satisfaction from personality in nationally representative samples from three countries: The relative importance of actor, partner, and similarity effects. Journal of Personality and Social Psychology, 99(4), 690–702.',
  },
  montoya2008: {
    short: 'Montoya, Horton & Kirchner, 2008',
    full: 'Montoya, R. M., Horton, R. S., & Kirchner, J. (2008). Is actual similarity necessary for attraction? A meta-analysis of actual and perceived similarity. Journal of Social and Personal Relationships, 25(6), 889–922.',
  },
  impett2024: {
    short: 'Impett, Park & Muise, 2024',
    full: 'Impett, E. A., Park, H. G., & Muise, A. (2024). Popular psychology through a scientific lens: Evaluating love languages from a relationship science perspective. Current Directions in Psychological Science, 33(2), 87–92.',
  },
  cutrona1990: {
    short: 'Cutrona & Russell, 1990',
    full: 'Cutrona, C. E., & Russell, D. W. (1990). Type of social support and specific stress: Toward a theory of optimal matching. In B. R. Sarason, I. G. Sarason, & G. R. Pierce (Eds.), Social support: An interactional view (pp. 319–366). Wiley.',
  },
  dew2012: {
    short: 'Dew, Britt & Huston, 2012',
    full: 'Dew, J., Britt, S., & Huston, S. (2012). Examining the relationship between financial issues and divorce. Family Relations, 61(4), 615–628.',
  },
  laurenceau1998: {
    short: 'Laurenceau, Barrett & Pietromonaco, 1998',
    full: 'Laurenceau, J.-P., Barrett, L. F., & Pietromonaco, P. R. (1998). Intimacy as an interpersonal process: The importance of self-disclosure, partner disclosure, and perceived partner responsiveness in interpersonal exchanges. Journal of Personality and Social Psychology, 74(5), 1238–1251.',
  },
  fraley2000: {
    short: 'Fraley, Waller & Brennan, 2000',
    full: 'Fraley, R. C., Waller, N. G., & Brennan, K. A. (2000). An item response theory analysis of self-report measures of adult attachment. Journal of Personality and Social Psychology, 78(2), 350–365.',
  },
} satisfies Record<string, Reference>;

export type ReferenceId = keyof typeof REFERENCES;

/**
 * The references for each finding, in the order the findings are written in
 * ui-strings. The first four are the ones the landing page shows.
 */
export const FINDING_REFS: ReferenceId[][] = [
  ['christensen1990', 'schrodt2014'],
  ['gottman1994', 'gottman1993'],
  ['joel2020', 'dyrenforth2010', 'montoya2008'],
  ['impett2024'],
  ['cutrona1990'],
  ['dew2012'],
  ['laurenceau1998', 'fraley2000'],
];

/** "A, Year · B, Year" for a finding. */
export const citeShort = (i: number) => FINDING_REFS[i].map((id) => REFERENCES[id].short).join(' · ');

/** Every reference used, in order of first appearance. */
export const referenceList = (): Reference[] => [...new Set(FINDING_REFS.flat())].map((id) => REFERENCES[id]);
