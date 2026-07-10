import { describe, it, expect } from 'vitest';

import { formatBaselineMarkdown } from './report';
import type { BaselineReport } from './types';

const report: BaselineReport = {
    total: 4,
    caught: 3,
    catchRate: 0.75,
    perKind: {
        nonfiction: { total: 2, caught: 2, catchRate: 1 },
        fiction: { total: 2, caught: 1, catchRate: 0.5 },
    },
    perCase: [
        { id: 'nf-a', kind: 'nonfiction', expectedErrorType: 'fabrication', caught: true, issues: ['i1'] },
        { id: 'nf-b', kind: 'nonfiction', expectedErrorType: 'contradiction', caught: true, issues: ['i2'] },
        { id: 'fic-a', kind: 'fiction', expectedErrorType: 'continuity', caught: true, issues: ['i3'] },
        { id: 'fic-b', kind: 'fiction', expectedErrorType: 'timeline', caught: false, issues: [] },
    ],
};

describe('formatBaselineMarkdown', () => {
    const md = formatBaselineMarkdown(report);

    it('renders the overall drift-catch rate and the caught/total fraction', () => {
        expect(md).toContain('75.0%');
        expect(md).toContain('(3/4 known errors caught)');
    });

    it('includes a per-kind table with both kinds and their rates', () => {
        expect(md).toContain('| non-fiction | 2 | 2 | 100.0% |');
        expect(md).toContain('| fiction | 1 | 2 | 50.0% |');
        expect(md).toContain('| **overall** | 3 | 4 | 75.0% |');
    });

    it('lists every case id in the per-case table', () => {
        for (const c of report.perCase) {
            expect(md).toContain(c.id);
        }
    });

    it('marks caught cases with ✅ and missed cases with ❌', () => {
        expect(md).toContain('| fic-b | fiction | timeline | ❌ |');
        expect(md).toContain('| nf-a | nonfiction | fabrication | ✅ |');
    });
});
