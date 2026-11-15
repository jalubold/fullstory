import type { Metadata } from 'next';
import { CompatHeader, FlowScreen } from '@/components/compat/Shell';
import { StartFlow } from '@/components/compat/StartFlow';
import { CONTEXTS } from '@/lib/compat/contexts';

export const metadata: Metadata = { title: 'Start the test' };

export default function StartPage() {
  return (
    <>
      <CompatHeader />
      <FlowScreen>
        <StartFlow contexts={CONTEXTS.map(({ id, label, hint }) => ({ id, label, hint }))} />
      </FlowScreen>
    </>
  );
}
