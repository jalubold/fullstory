import { permanentRedirect } from 'next/navigation';

/** The pricing page was retired; prices are shown at checkout. Old links land on the homepage. */
export default function PricingPage() {
  permanentRedirect('/');
}
